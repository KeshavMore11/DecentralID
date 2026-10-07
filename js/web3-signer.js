/**
 * Web3Signer
 * 
 * Handles off-chain EIP-712 typed data signing and verification for credentials
 * using MetaMask and ethers.js on the Sepolia testnet (Chain ID: 11155111).
 * 
 * Gasless & Off-Chain:
 * - NO on-chain transactions
 * - NO gas or ETH required
 * - Credentials remain private and are NOT stored on the blockchain.
 */

class Web3Signer {
    constructor() {
        this.SEPOLIA_CHAIN_ID = 11155111;
        this.SEPOLIA_HEX = '0xaa36a7';

        // EIP-712 Domain Definition
        this.domain = {
            name: 'DecentraID',
            version: '1',
            chainId: this.SEPOLIA_CHAIN_ID
        };

        // EIP-712 Typed Data Schema
        this.types = {
            Credential: [
                { name: 'credentialId', type: 'string' },
                { name: 'issuerDID', type: 'string' },
                { name: 'subjectDID', type: 'string' },
                { name: 'credentialHash', type: 'string' },
                { name: 'issuanceDate', type: 'string' }
            ]
        };

        this._listenersAttached = false;
        this._stateChangeCallbacks = new Set();
    }

    /**
     * Check if window.ethereum (MetaMask or compatible Web3 provider) is available
     * @returns {boolean}
     */
    isAvailable() {
        if (typeof window === 'undefined' || typeof window.ethereum === 'undefined') {
            throw new Error("MetaMask not found. Install MetaMask (in Brave: set Default Ethereum wallet to MetaMask at brave://settings/web3)");
        }
        return true;
    }

    /**
     * Format Ethereum address to compact form: 0x12ab...89cd
     * @param {string} address 
     * @returns {string}
     */
    formatAddress(address) {
        if (!address || typeof address !== 'string' || address.length < 10) return address || '';
        return `${address.substring(0, 6)}...${address.substring(address.length - 4)}`;
    }

    /**
     * Get current status of MetaMask connection
     * @returns {Promise<Object>} Status object
     */
    async getStatus() {
        if (typeof window === 'undefined' || typeof window.ethereum === 'undefined') {
            return {
                available: false,
                connected: false,
                account: null,
                formattedAddress: null,
                chainId: null,
                isSepolia: false,
                error: "MetaMask not found"
            };
        }

        try {
            const accounts = await window.ethereum.request({ method: 'eth_accounts' });
            const chainIdHex = await window.ethereum.request({ method: 'eth_chainId' });
            const chainId = chainIdHex ? parseInt(chainIdHex, 16) : null;
            const isSepolia = chainId === this.SEPOLIA_CHAIN_ID;
            const account = accounts && accounts.length > 0 ? (window.ethers ? window.ethers.getAddress(accounts[0]) : accounts[0]) : null;

            return {
                available: true,
                connected: !!account,
                account: account,
                formattedAddress: account ? this.formatAddress(account) : null,
                chainId: chainId,
                isSepolia: isSepolia,
                error: null
            };
        } catch (err) {
            return {
                available: true,
                connected: false,
                account: null,
                formattedAddress: null,
                chainId: null,
                isSepolia: false,
                error: err.message
            };
        }
    }

    /**
     * Connect to MetaMask and request user accounts
     * @returns {Promise<string>} Checksummed Ethereum address
     */
    async connect() {
        this.isAvailable();

        try {
            const accounts = await window.ethereum.request({ method: 'eth_requestAccounts' });
            if (!accounts || accounts.length === 0) {
                throw new Error("No Ethereum accounts found in MetaMask.");
            }

            if (window.ethers) {
                return window.ethers.getAddress(accounts[0]);
            }
            return accounts[0];
        } catch (error) {
            if (error.code === 4001 || error.code === 'ACTION_REJECTED' || String(error.message).toLowerCase().includes('user rejected')) {
                throw new Error("MetaMask connection was rejected by the user.");
            }
            throw new Error("MetaMask connection failed: " + (error.message || error));
        }
    }

    /**
     * Ensure the active network in MetaMask is Sepolia (chainId: 11155111 / 0xaa36a7)
     * Prompts the user to switch or add the Sepolia network if necessary.
     * @returns {Promise<boolean>}
     */
    async ensureSepolia() {
        this.isAvailable();

        const currentChainIdHex = await window.ethereum.request({ method: 'eth_chainId' });
        const currentChainId = parseInt(currentChainIdHex, 16);

        if (currentChainId === this.SEPOLIA_CHAIN_ID || currentChainIdHex.toLowerCase() === this.SEPOLIA_HEX.toLowerCase()) {
            return true;
        }

        try {
            // Attempt switching to Sepolia
            await window.ethereum.request({
                method: 'wallet_switchEthereumChain',
                params: [{ chainId: this.SEPOLIA_HEX }]
            });
        } catch (switchError) {
            // Error code 4902 indicates that Sepolia has not been added to MetaMask
            const isUnrecognized = switchError.code === 4902 || 
                                   switchError.data?.originalError?.code === 4902 ||
                                   String(switchError.message).includes('4902') ||
                                   String(switchError.message).toLowerCase().includes('unrecognized');

            if (isUnrecognized) {
                try {
                    await window.ethereum.request({
                        method: 'wallet_addEthereumChain',
                        params: [{
                            chainId: this.SEPOLIA_HEX,
                            chainName: 'Sepolia',
                            nativeCurrency: {
                                name: 'Sepolia Ether',
                                symbol: 'ETH',
                                decimals: 18
                            },
                            rpcUrls: ['https://rpc.sepolia.org'],
                            blockExplorerUrls: ['https://sepolia.etherscan.io']
                        }]
                    });
                } catch (addError) {
                    if (addError.code === 4001 || addError.code === 'ACTION_REJECTED') {
                        throw new Error("User rejected adding the Sepolia testnet to MetaMask.");
                    }
                    throw new Error("Failed to add Sepolia testnet to MetaMask: " + addError.message);
                }
            } else if (switchError.code === 4001 || switchError.code === 'ACTION_REJECTED') {
                throw new Error("User rejected switching network to Sepolia.");
            } else {
                throw new Error("Failed to switch network to Sepolia: " + switchError.message);
            }
        }

        // Verify final chain
        const finalChainIdHex = await window.ethereum.request({ method: 'eth_chainId' });
        if (parseInt(finalChainIdHex, 16) !== this.SEPOLIA_CHAIN_ID) {
            throw new Error("Please switch your MetaMask network to Sepolia (Chain ID 11155111).");
        }

        return true;
    }

    /**
     * Compute the canonical Keccak256 hash of the credential payload (excluding proofs)
     * Matches the canonical JSON serialization used by the DID ECDSA proof.
     * @param {Object} credential 
     * @returns {string} Hex keccak256 hash string (0x...)
     */
    hashCredential(credential) {
        if (!window.ethers) {
            throw new Error("ethers.js is required but not loaded.");
        }

        const credentialCopy = { ...credential };
        delete credentialCopy.proof;
        delete credentialCopy.ethereumProof;

        const canonicalJson = JSON.stringify(credentialCopy);
        return window.ethers.keccak256(window.ethers.toUtf8Bytes(canonicalJson));
    }

    /**
     * Prompt MetaMask to sign the credential with EIP-712 typed data
     * @param {Object} credential - The credential object without proofs
     * @returns {Promise<Object>} Ethereum proof object
     */
    async signCredential(credential) {
        if (!window.ethers) {
            throw new Error("ethers.js is not loaded. Please ensure js/vendor/ethers.umd.min.js is present.");
        }

        this.isAvailable();
        await this.connect();
        await this.ensureSepolia();

        // Calculate Keccak256 hash of credential without proofs
        const credentialHash = this.hashCredential(credential);

        // Build typed data value according to EIP-712 schema
        const value = {
            credentialId: credential.id,
            issuerDID: credential.issuer,
            subjectDID: credential.credentialSubject?.id || '',
            credentialHash: credentialHash,
            issuanceDate: credential.issuanceDate
        };

        try {
            const provider = new window.ethers.BrowserProvider(window.ethereum);
            const signer = await provider.getSigner();

            const signature = await signer.signTypedData(this.domain, this.types, value);
            const signerAddress = window.ethers.getAddress(await signer.getAddress());

            return {
                type: 'EthereumEip712Signature',
                chainId: this.SEPOLIA_CHAIN_ID,
                network: 'sepolia',
                signerAddress: signerAddress,
                credentialHash: credentialHash,
                signature: signature,
                created: new Date().toISOString()
            };
        } catch (error) {
            if (error.code === 4001 || error.code === 'ACTION_REJECTED' || String(error.message).toLowerCase().includes('user rejected') || String(error.message).toLowerCase().includes('user denied')) {
                throw new Error("MetaMask signature request was rejected by the user.");
            }
            throw new Error("MetaMask signing failed: " + (error.message || error));
        }
    }

    /**
     * Verify an Ethereum EIP-712 signature on a credential
     * Operates purely via cryptographic math (does NOT require MetaMask or wallet).
     * @param {Object} credential - Verifiable Credential containing ethereumProof
     * @returns {Object} { valid: boolean, signerAddress: string, chainId: number, network: string, error?: string }
     */
    verifyCredentialSignature(credential) {
        if (!window.ethers) {
            return {
                valid: false,
                signerAddress: null,
                chainId: this.SEPOLIA_CHAIN_ID,
                network: 'sepolia',
                error: 'ethers.js is not loaded'
            };
        }

        try {
            if (!credential || !credential.ethereumProof) {
                return {
                    valid: false,
                    signerAddress: null,
                    chainId: this.SEPOLIA_CHAIN_ID,
                    network: 'sepolia',
                    error: 'No Ethereum proof found on credential'
                };
            }

            const proof = credential.ethereumProof;
            if (!proof.signature || !proof.signerAddress || !proof.credentialHash) {
                return {
                    valid: false,
                    signerAddress: proof.signerAddress || null,
                    chainId: proof.chainId || this.SEPOLIA_CHAIN_ID,
                    network: proof.network || 'sepolia',
                    error: 'Incomplete Ethereum proof object structure'
                };
            }

            // 1. Recompute the hash of the credential payload (excluding proofs)
            const cleanCopy = { ...credential };
            delete cleanCopy.proof;
            delete cleanCopy.ethereumProof;

            const canonicalJson = JSON.stringify(cleanCopy);
            const recomputedHash = window.ethers.keccak256(window.ethers.toUtf8Bytes(canonicalJson));

            if (recomputedHash !== proof.credentialHash) {
                return {
                    valid: false,
                    signerAddress: proof.signerAddress,
                    chainId: proof.chainId || this.SEPOLIA_CHAIN_ID,
                    network: proof.network || 'sepolia',
                    error: 'Credential hash mismatch: credential content has been tampered with or modified'
                };
            }

            // 2. Reconstruct typed data value
            const value = {
                credentialId: credential.id,
                issuerDID: credential.issuer,
                subjectDID: credential.credentialSubject?.id || '',
                credentialHash: proof.credentialHash,
                issuanceDate: credential.issuanceDate
            };

            const domain = {
                name: 'DecentraID',
                version: '1',
                chainId: proof.chainId || this.SEPOLIA_CHAIN_ID
            };

            // 3. Recover signer address from EIP-712 signature
            const recoveredAddress = window.ethers.verifyTypedData(domain, this.types, value, proof.signature);
            const expectedAddress = window.ethers.getAddress(proof.signerAddress);
            const checksumRecovered = window.ethers.getAddress(recoveredAddress);

            if (checksumRecovered.toLowerCase() !== expectedAddress.toLowerCase()) {
                return {
                    valid: false,
                    signerAddress: checksumRecovered,
                    expectedSigner: expectedAddress,
                    chainId: proof.chainId || this.SEPOLIA_CHAIN_ID,
                    network: proof.network || 'sepolia',
                    error: `Recovered address (${checksumRecovered}) does not match declared signer (${expectedAddress})`
                };
            }

            return {
                valid: true,
                signerAddress: checksumRecovered,
                chainId: proof.chainId || this.SEPOLIA_CHAIN_ID,
                network: proof.network || 'sepolia',
                error: null
            };

        } catch (error) {
            return {
                valid: false,
                signerAddress: credential?.ethereumProof?.signerAddress || null,
                chainId: credential?.ethereumProof?.chainId || this.SEPOLIA_CHAIN_ID,
                network: credential?.ethereumProof?.network || 'sepolia',
                error: error.message || 'Verification exception'
            };
        }
    }

    /**
     * Register a callback for MetaMask account or chain changes
     * @param {Function} callback 
     */
    onStateChange(callback) {
        if (typeof callback === 'function') {
            this._stateChangeCallbacks.add(callback);
        }
        this._setupListeners();
    }

    /**
     * Remove a registered state change callback
     * @param {Function} callback 
     */
    offStateChange(callback) {
        this._stateChangeCallbacks.delete(callback);
    }

    _setupListeners() {
        if (this._listenersAttached || typeof window === 'undefined' || !window.ethereum) {
            return;
        }

        const notify = async () => {
            const status = await this.getStatus();
            for (const cb of this._stateChangeCallbacks) {
                try {
                    cb(status);
                } catch (e) {
                    console.error('Error in Web3 state change callback:', e);
                }
            }
        };

        try {
            window.ethereum.on('accountsChanged', () => notify());
            window.ethereum.on('chainChanged', () => notify());
            this._listenersAttached = true;
        } catch (e) {
            console.warn('Could not attach MetaMask event listeners:', e);
        }
    }
}

// Export singleton
window.web3Signer = new Web3Signer();
