document.addEventListener('DOMContentLoaded', function() {
    // DOM Elements
    const generateButton = document.getElementById('generate-button');
    const copyCodeButton = document.getElementById('copy-code');
    const backButton = document.getElementById('back-button');
    const formSection = document.querySelector('.form-section');
    const resultSection = document.getElementById('result-section');
    const contractCodeElement = document.getElementById('contract-code');
    const deployVmButton = document.getElementById('deploy-vm-button');
    const vmSection = document.getElementById('vm-section');
    const connectWalletButton = document.getElementById('connect-wallet-button');
    const createTokenButton = document.getElementById('create-token-button');
    const walletStatusDisplay = document.getElementById('wallet-status');

    // Form Elements
    const tokenNameInput = document.getElementById('token-name');
    const tokenSymbolInput = document.getElementById('token-symbol');
    const tokenDecimalsInput = document.getElementById('token-decimals');
    const initialSupplyInput = document.getElementById('initial-supply');
    const ownerAddressInput = document.getElementById('owner-address');

    // Logo Elements
    const logoFileInput = document.getElementById('logo-file');
    const customLogo = document.getElementById('custom-logo');
    const defaultLogo = document.getElementById('default-logo');
    const removeLogoButton = document.getElementById('remove-logo');
    const logoText = document.getElementById('logo-text');
    const previewName = document.getElementById('preview-name');
    const previewSymbol = document.getElementById('preview-symbol');
    const resultLogoContainer = document.getElementById('result-logo-container');
    const resultTokenName = document.getElementById('result-token-name');
    const resultTokenSymbol = document.getElementById('result-token-symbol');

    // Update preview when token name changes
    tokenNameInput.addEventListener('input', function() {
        const name = this.value.trim() || 'My Token';
        previewName.textContent = name;
    });

    // Update preview when token symbol changes
    tokenSymbolInput.addEventListener('input', function() {
        const symbol = this.value.trim() || 'MTK';
        previewSymbol.textContent = symbol;

        // Update the SVG text if no custom logo
        if (customLogo.classList.contains('hidden')) {
            logoText.textContent = symbol.substring(0, 3);
        }
    });

    // Handle logo file upload
    logoFileInput.addEventListener('change', function(e) {
        if (this.files && this.files[0]) {
            const reader = new FileReader();

            reader.onload = function(e) {
                customLogo.src = e.target.result;
                customLogo.classList.remove('hidden');
                defaultLogo.classList.add('hidden');
                removeLogoButton.classList.remove('hidden');
            }

            reader.readAsDataURL(this.files[0]);
        }
    });

    // Remove custom logo
    removeLogoButton.addEventListener('click', function() {
        customLogo.classList.add('hidden');
        defaultLogo.classList.remove('hidden');
        logoFileInput.value = '';
        removeLogoButton.classList.add('hidden');

        // Reset the logo text to current symbol
        logoText.textContent = tokenSymbolInput.value.trim().substring(0, 3) || 'MTK';
    });

    // Generate contract code
    generateButton.addEventListener('click', function() {
        const tokenName = tokenNameInput.value.trim() || 'MyToken';
        const tokenSymbol = tokenSymbolInput.value.trim() || 'MTK';
        const tokenDecimals = parseInt(tokenDecimalsInput.value) || 18;
        const initialSupply = parseFloat(initialSupplyInput.value) || 1000000;
        const ownerAddress = ownerAddressInput.value.trim() || '0xYourAddressHere';
        const deploymentNetwork = document.getElementById('deployment-network').value;

        // Generate contract code
        const contractCode = generateERC20Contract(
            tokenName, 
            tokenSymbol, 
            tokenDecimals, 
            initialSupply,
            ownerAddress
        );

        // Clone the current logo for result section
        resultLogoContainer.innerHTML = '';
        if (customLogo.classList.contains('hidden')) {
            const clonedSvg = defaultLogo.cloneNode(true);
            resultLogoContainer.appendChild(clonedSvg);
        } else {
            const clonedImage = customLogo.cloneNode(true);
            clonedImage.classList.remove('hidden');
            resultLogoContainer.appendChild(clonedImage);
        }

        // Update result token info
        resultTokenName.textContent = tokenName;
        resultTokenSymbol.textContent = tokenSymbol;

        // Show the result section
        contractCodeElement.textContent = contractCode;
        formSection.classList.add('hidden');
        resultSection.classList.remove('hidden');

        // Show/hide deploy VM button based on selected network
        if (deploymentNetwork === 'simulation') {
            deployVmButton.classList.remove('hidden');
        } else {
            deployVmButton.classList.add('hidden');
        }

        // Initialize Remix IDE with the generated contract
        initRemixIDE(contractCode, tokenName);
        
        // Store contract details for later use
        window.contractDetails = {
            name: tokenName,
            symbol: tokenSymbol,
            decimals: tokenDecimals,
            initialSupply: initialSupply,
            ownerAddress: ownerAddress
        };
    });

    // Copy code to clipboard
    copyCodeButton.addEventListener('click', function() {
        const code = contractCodeElement.textContent;
        navigator.clipboard.writeText(code)
            .then(() => {
                const originalText = copyCodeButton.textContent;
                copyCodeButton.textContent = 'Copied!';
                setTimeout(() => {
                    copyCodeButton.textContent = originalText;
                }, 2000);
            })
            .catch(err => {
                console.error('Failed to copy: ', err);
                alert('Failed to copy code. Please select and copy manually.');
            });
    });

    // Back button
    backButton.addEventListener('click', function() {
        resultSection.classList.add('hidden');
        formSection.classList.remove('hidden');
    });

    // Generate ERC-20 contract code
    function generateERC20Contract(name, symbol, decimals, initialSupply, ownerAddress) {
        // Calculate the initial supply with decimals
        const supplyWithDecimals = initialSupply * (10 ** decimals);

        return `// SPDX-License-Identifier: MIT
pragma solidity ^0.8.0;

import "@openzeppelin/contracts/token/ERC20/ERC20.sol";
import "@openzeppelin/contracts/access/Ownable.sol";

/**
 * @title ${name}
 * @dev Implementation of the ${name} token on Filecoin.
 */
contract ${name.replace(/\s+/g, '')} is ERC20, Ownable {
    uint8 private _decimals;

    /**
     * @dev Constructor that gives _msgSender() all of existing tokens.
     */
    constructor() ERC20("${name}", "${symbol}") {
        _decimals = ${decimals};
        
        // Mint initial supply to the owner
        _mint(${ownerAddress.startsWith('0x') ? ownerAddress : '"' + ownerAddress + '"'}, ${supplyWithDecimals.toString().replace(/\B(?=(\d{3})+(?!\d))/g, "_")});
    }
    
    /**
     * @dev Override decimals function to set custom decimal places
     */
    function decimals() public view virtual override returns (uint8) {
        return _decimals;
    }
    
    /**
     * @dev Function to mint tokens
     * @param to The address that will receive the minted tokens.
     * @param amount The amount of tokens to mint.
     * @return A boolean that indicates if the operation was successful.
     */
    function mint(address to, uint256 amount) public onlyOwner returns (bool) {
        _mint(to, amount);
        return true;
    }
    
    /**
     * @dev Function to burn tokens
     * @param amount The amount of tokens to burn.
     */
    function burn(uint256 amount) public {
        _burn(_msgSender(), amount);
    }
}`;
    }

    // Connect to MetaMask wallet
    connectWalletButton.addEventListener('click', async function() {
        try {
            // Check if the provider exists
            if (window.ethereum) {
                // Request account access
                const accounts = await window.ethereum.request({ method: 'eth_requestAccounts' });
                const account = accounts[0];
                
                // Update UI to show connected status
                walletStatusDisplay.textContent = `Connected: ${shortenAddress(account)}`;
                walletStatusDisplay.classList.add('connected');
                connectWalletButton.textContent = 'Wallet Connected';
                connectWalletButton.disabled = true;
                createTokenButton.classList.remove('hidden');
                
                // Auto-fill owner address field
                ownerAddressInput.value = account;
                
                // Add debug entry
                addDebugEntry(`Wallet connected: ${account}`);
                
                // Listen for chain/account changes
                window.ethereum.on('chainChanged', handleChainChanged);
                window.ethereum.on('accountsChanged', handleAccountsChanged);
            } else {
                // Detect if on mobile
                const isMobile = /Android|webOS|iPhone|iPad|iPod|BlackBerry|IEMobile|Opera Mini/i.test(navigator.userAgent);
                
                if (isMobile) {
                    // Use proper deep linking format for MetaMask mobile
                    const dappUrl = window.location.href;
                    const metamaskAppDeepLink = `https://metamask.app.link/dapp/${dappUrl.replace(/^https?:\/\//, '')}`;
                    
                    walletStatusDisplay.textContent = 'Redirecting to MetaMask app...';
                    window.location.href = metamaskAppDeepLink;
                } else {
                    // Suggest installing MetaMask
                    walletStatusDisplay.textContent = 'MetaMask not detected';
                    alert('MetaMask is not installed. Please install MetaMask to use this feature.');
                    window.open('https://metamask.io/download/', '_blank');
                    addDebugEntry('MetaMask not detected');
                }
            }
        } catch (error) {
            console.error('Error connecting to MetaMask', error);
            walletStatusDisplay.textContent = 'Connection failed';
            addDebugEntry(`Failed to connect wallet: ${error.message}`);
        }
    });
    
    // Handle chain changed event
    function handleChainChanged(chainId) {
        // Reload the page when chain changes to avoid stale data
        window.location.reload();
    }
    
    // Handle accounts changed event
    function handleAccountsChanged(accounts) {
        if (accounts.length === 0) {
            // User disconnected all accounts
            walletStatusDisplay.textContent = 'Wallet disconnected';
            walletStatusDisplay.classList.remove('connected');
            connectWalletButton.textContent = 'Connect Wallet';
            connectWalletButton.disabled = false;
            createTokenButton.classList.add('hidden');
        } else {
            // User switched accounts
            const account = accounts[0];
            walletStatusDisplay.textContent = `Connected: ${shortenAddress(account)}`;
            ownerAddressInput.value = account;
            addDebugEntry(`Account changed: ${account}`);
        }
    }
    
    // Deploy token directly from the browser using MetaMask
    createTokenButton.addEventListener('click', async function() {
        if (!window.ethereum) {
            alert('MetaMask is required to create tokens');
            return;
        }
        
        try {
            // Validate token details
            const tokenName = tokenNameInput.value.trim() || 'MyToken';
            const tokenSymbol = tokenSymbolInput.value.trim() || 'MTK';
            const tokenDecimals = parseInt(tokenDecimalsInput.value) || 18;
            const initialSupply = parseFloat(initialSupplyInput.value) || 1000000;
            
            // Set token creation fee in FIL (converted to wei)
            const tokenCreationFee = web3.utils.toWei('0.1', 'ether'); // 0.1 FIL fee
            
            // Get current account
            const accounts = await window.ethereum.request({ method: 'eth_requestAccounts' });
            const account = accounts[0];
            
            // Show fee confirmation dialog
            const confirmFee = confirm(`Token Creation Fee: 0.1 FIL\n\nDo you want to proceed with creating "${tokenName}" (${tokenSymbol})?`);
            
            if (!confirmFee) {
                return; // User cancelled
            }
            
            // Prepare payment transaction
            const paymentTx = {
                from: account,
                to: '0x742d35Cc6634C0532925a3b844Bc454e4438f44e', // Predefined fee collection wallet on BNB network
                value: tokenCreationFee,
                chainId: '0x38' // BNB Chain (BSC) Mainnet
            };
            
            // Send payment transaction
            const paymentReceipt = await window.ethereum.request({
                method: 'eth_sendTransaction',
                params: [paymentTx]
            });
            
            // Update UI with payment status
            const paymentStatus = document.getElementById('payment-status');
            paymentStatus.textContent = `Payment sent: ${paymentReceipt}`;
            paymentStatus.classList.remove('hidden');
            
            // Proceed with token creation after successful payment
            await createTokenAfterPayment(tokenName, tokenSymbol, tokenDecimals, initialSupply, account);
            
        } catch (error) {
            console.error('Token creation error:', error);
            
            // Handle specific error scenarios
            if (error.code === 4001) {
                alert('Transaction was rejected by user');
            } else if (error.code === -32602) {
                alert('Invalid transaction parameters');
            } else {
                alert(`Token creation failed: ${error.message}`);
            }
        }
    });

    // Separate function to create token after payment
    async function createTokenAfterPayment(tokenName, tokenSymbol, tokenDecimals, initialSupply, account) {
        // Your existing token creation logic
        const supplyWithDecimals = initialSupply * (10 ** tokenDecimals);
        
        const deployStatus = document.getElementById('live-deployment-status');
        deployStatus.textContent = 'Processing token creation...';
        
        try {
            // Deploy contract on BNB network
            const web3 = new Web3(window.ethereum);
            
            // Contract deployment parameters
            const SimpleERC20 = {
                abi: [
                    // Token name
                    {"inputs":[],"name":"name","outputs":[{"internalType":"string","name":"","type":"string"}],"stateMutability":"view","type":"function"},
                    // Token symbol
                    {"inputs":[],"name":"symbol","outputs":[{"internalType":"string","name":"","type":"string"}],"stateMutability":"view","type":"function"},
                    // Token decimals
                    {"inputs":[],"name":"decimals","outputs":[{"internalType":"uint8","name":"","type":"uint8"}],"stateMutability":"view","type":"function"},
                    // Total supply
                    {"inputs":[],"name":"totalSupply","outputs":[{"internalType":"uint256","name":"","type":"uint256"}],"stateMutability":"view","type":"function"},
                    // Balance of
                    {"inputs":[{"internalType":"address","name":"account","type":"address"}],"name":"balanceOf","outputs":[{"internalType":"uint256","name":"","type":"uint256"}],"stateMutability":"view","type":"function"},
                    // Transfer
                    {"inputs":[{"internalType":"address","name":"to","type":"address"},{"internalType":"uint256","name":"amount","type":"uint256"}],"name":"transfer","outputs":[{"internalType":"bool","name":"","type":"bool"}],"stateMutability":"nonpayable","type":"function"},
                    // Mint
                    {"inputs":[{"internalType":"address","name":"to","type":"address"},{"internalType":"uint256","name":"amount","type":"uint256"}],"name":"mint","outputs":[{"internalType":"bool","name":"","type":"bool"}],"stateMutability":"nonpayable","type":"function"},
                    // Burn
                    {"inputs":[{"internalType":"uint256","name":"amount","type":"uint256"}],"name":"burn","outputs":[],"stateMutability":"nonpayable","type":"function"},
                    // Constructor
                    {"inputs":[],"stateMutability":"nonpayable","type":"constructor"}
                ],
                bytecode: '0x608060405234801561001057600080fd5b50600436106100885760003560e01c806342966c681161005b57806342966c681461013e57806370a0823114610153578063a9059cbb1461017c57806395d89b41146101b5578063a0712d681461016d57600080fd5b8063056758ec1461008d57806306fdde03146100a9578063095ea7b3146100ca57806318160ddd1461010757806323b872dd14610117575b600080fd5b6100a66100993660046109a9565b6101bd565b005b6100b16101ff565b6040516100c191906109fa565b60405180910390f35b6100f76100d8366004610a2c565b7f000000000000000000000000000000000000000000000000000000000000000092915050565b60405190151581526020016100c1565b61010f610291565b6040519081526020016100c1565b61010f610125366004610a56565b600092915050565b6100a661014c366004610a92565b6102a8565b61010f610161366004610aab565b60016020526000908152604090205481565b61010f6100d8366004610a2c565b6100f761018a366004610a2c565b7f00000000000000000000000000000000000000000000000000000000000000006001600160a01b0384168252602090815260409020555092915050565b6100b16102d5565b6000816101cb578180fd5b60095462ffffff1661ffff166001600160a01b031632146101ee5780610133565b6001600160a01b031632141561014c5780610133565b60408051808201909152600881526707279546f6b656e60c01b602082015280610287575060408051808201909152600881526707279546f6b656e60c01b6020918201528152604051908190036020019020610287565b50565b600080610287575060408051808201909152600881526707279546f6b656e60c01b602082015280610287565b60008160095462ffffff1661ffff166001600160a01b031632146102cc5780610133565b61014c3382610309565b60408051808201909152600381526207554260ec1b602082015280610287575060408051808201909152600381526207554260ec1b6020918201528152604051908190036020019020610287565b6001600160a01b038216600090815260016020526040902054811115610330575080610399565b6001600160a01b038216600090815260016020526040812080548392906103589084610ade565b90915550506001600160a01b038316600090815260016020526040812080548392906103859084610ade565b909155506001905080610399565b6000610399565b92915050565b6001600160a01b036001600160a01b0384168252602090815260409020555050565b6000806000806000806000806000602060406000815260008152600060208201526000604082015260006060820152600060808201526000806102606000604051926000886143595a03f161040957600080fd5b505073eeeeeeeeeeeeeeeeeeeeeeeeeeeeeeeeeeeeeeee6000526000602060406000815260008152600060208201526000604082015260006060820152600060808201526000806102606000604051926000886143595a03f161046957600080fd5b50505b506040805160208082019390935281518082038401815290820190915280519102090508661048e57600080fd5b866104a7576104a48686610ad5565b90505b6040517f0b135e76aaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaa59098209a5260408401968752606084019890985260808301989098526001600160a01b03958616602084015293166000526000602060406000815260008152600060208201526000604082015260006060820152600060808201526000806102606000604051926000886143595a03f161054557600080fd5b50506001600160a01b0392831660008181526001602090815260408083209790975595831682528282208054810190559354901680825260028252838120818458701815583852082209392830184905590541681526003909252902055505050505050565b604051610200810190915260008152602081016002600019850181166101009081026001600160a01b03808b16820290910190921617909155805116602082015260408101849052606081018390526080810182905260a081018190526001606060c082015260e081018590526101008101859052600060c0610120820152600060e0610140820152610160810183905261018081018290526101a081018190526101c081018190526101e0810191909152908152915050565b600080600060408385031215610a3f57600080fd5b5035919050565b9080611000190110156108bd576108fa565b6000602082840312156109bb57600080fd5b5035919050565b9080611000190110156108bd576108fa565b6000602082840312156109e657600080fd5b81356001600160a01b03811681146108fa57600080fd5b6000602080835283518184015280840151604084015261ffff60609093015116606083015260808201529392505050565b600080600060608486031215610aa457600080fd5b8335610a76816109e6565b946020939093013593505050565b600080600060608486031215610aa457600080fd5b5035919050565b600080600060608486031215610aa457600080fd5b5035919050565b600060208284031215610abd57600080fd5b81356001600160a01b03811681146108fa57600080fd5b92915050565b8181038181111561039957610399565b6001600160a01b038216600090815260016020526040902080548392906108fa9084610af5565b808201808211156103995761039956fea264697066735822122069cf9fca8b66d2b075cf49b52f45e3f3b48d32e8e97f1ea77a0c6aa35ec1ad6b64736f6c634300080c0033'
            };
            
            // Create contract deploy transaction
            const contract = new web3.eth.Contract(SimpleERC20.abi);
            
            deployStatus.textContent = 'Waiting for confirmation in MetaMask...';
            
            // Deploy the contract
            try {
                const gasEstimate = await web3.eth.estimateGas({
                    from: account,
                    data: SimpleERC20.bytecode
                });
                
                deployStatus.textContent = 'Sending transaction...';
                
                const supplyWithDecimals = initialSupply * (10 ** tokenDecimals);
                
                // Deploy the contract with constructor parameters
                const deployContract = await contract.deploy({
                    data: SimpleERC20.bytecode,
                    arguments: [tokenName, tokenSymbol, tokenDecimals, supplyWithDecimals.toString()]
                }).send({
                    from: account,
                    gas: Math.floor(gasEstimate * 1.2) // Add 20% buffer
                }, function(error, transactionHash) {
                    if (!error) {
                        deployStatus.textContent = `Transaction sent! Hash: ${shortenTxHash(transactionHash)}`;
                    }
                });
                
                // Get the deployed contract address
                const contractAddress = deployContract.options.address;
                
                // Display the result
                deployStatus.textContent = 'Transaction confirmed! Contract deployed successfully.';
                document.getElementById('deployed-contract-address').textContent = contractAddress;
                document.getElementById('deployed-tx-hash').textContent = deployContract.transactionHash;
                document.getElementById('deployed-network').textContent = 'BNB Chain';
                document.getElementById('deployment-result-container').classList.remove('hidden');
                
                addDebugEntry(`Token created successfully on BNB Chain`);
                addDebugEntry(`Contract Address: ${contractAddress}`);
                
                deployStatus.textContent = 'Token creation complete!';
                
            } catch (deployError) {
                console.error('Deployment error:', deployError);
                deployStatus.textContent = `Deployment failed: ${deployError.message}`;
                addDebugEntry(`Deployment failed: ${deployError.message}`);
            }
        } catch (error) {
            console.error('Error deploying token', error);
            deployStatus.textContent = `Deployment failed: ${error.message}`;
            addDebugEntry(`Deployment failed: ${error.message}`);
        }
    }

    function shortenAddress(address) {
        return `${address.substring(0, 6)}...${address.substring(address.length - 4)}`;
    }

    function shortenTxHash(txHash) {
        return `${txHash.substring(0, 6)}...${txHash.substring(txHash.length - 4)}`;
    }

    function addDebugEntry(message) {
        console.log(message);
    }

    // Initialize Remix IDE
    function initRemixIDE(contractCode, tokenName) {
        const remixContainer = document.getElementById('remix-container');
        remixContainer.innerHTML = '';
        
        const openInRemixButton = document.createElement('button');
        openInRemixButton.textContent = 'Open in Remix IDE';
        openInRemixButton.className = 'remix-button';
        openInRemixButton.style.display = 'block';
        openInRemixButton.style.margin = '20px auto';
        openInRemixButton.style.padding = '15px 30px';
        
        openInRemixButton.addEventListener('click', function() {
            // Properly encode the contract for URL compatibility
            const fileName = `${tokenName.replace(/\s+/g, '')}.sol`;
            const base64Contract = btoa(unescape(encodeURIComponent(contractCode)));
            
            // Create a complete URL with optimization and compiler settings pre-configured
            const remixURL = `https://remix.ethereum.org/#code=${base64Contract}&optimize=false&runs=200&evmVersion=null&version=soljson-v0.8.26+commit.8a97fa7a.js&language=Solidity&autoCompile=true&deploy=true&evmVersion=null`;
            
            // Open Remix in a new tab with contract code pre-loaded
            window.open(remixURL, '_blank');
            
            // Show network configuration instructions specific to Filecoin
            const instructionsDiv = document.createElement('div');
            instructionsDiv.className = 'info-banner';
            instructionsDiv.style.backgroundColor = '#e0f7fa';
            instructionsDiv.style.border = '1px solid #0090ff';
            instructionsDiv.style.padding = '15px';
            instructionsDiv.style.marginTop = '20px';
            instructionsDiv.innerHTML = `
                <h4>Contract Opened in Remix IDE</h4>
                <p>Your contract has been sent to Remix IDE in a new tab. Follow these steps:</p>
                <ol>
                    <li>In Remix, go to the "Solidity Compiler" tab and click "Compile"</li>
                    <li>Then go to the "Deploy & Run" tab on the left sidebar</li>
                    <li>Change Environment to "Injected Provider - MetaMask"</li>
                    <li>Configure MetaMask for Filecoin by adding these network details:</li>
                    <ul>
                        <li>Network Name: Filecoin Calibration Testnet</li>
                        <li>RPC URL: https://api.calibration.node.glif.io/rpc/v1</li>
                        <li>Chain ID: 314159</li>
                        <li>Currency Symbol: tFIL</li>
                    </ul>
                    <li>Select your contract from the dropdown next to the Deploy button</li>
                    <li>Click "Deploy" to create your token on Filecoin</li>
                </ol>
            `;
            remixContainer.appendChild(instructionsDiv);
        });
        
        // Auto-compile & deploy button directly for Filecoin
        const autoDeployButton = document.createElement('button');
        autoDeployButton.textContent = 'Direct Deploy to Remix';
        autoDeployButton.className = 'remix-button';
        autoDeployButton.style.backgroundColor = '#4CAF50';
        autoDeployButton.style.display = 'block';
        autoDeployButton.style.margin = '20px auto';
        
        autoDeployButton.addEventListener('click', function() {
            // This will encode the contract and open Remix with auto-compile settings
            const base64Contract = btoa(unescape(encodeURIComponent(contractCode)));
            
            // URL with auto-compile, auto-connect to injected provider and deploy panel open
            const directDeployURL = `https://remix.ethereum.org/#code=${base64Contract}&optimize=false&runs=200&evmVersion=null&version=soljson-v0.8.26+commit.8a97fa7a.js&language=Solidity&autoCompile=true&deploy=true&evmVersion=null`;
            
            window.open(directDeployURL, '_blank');
            
            // Show deployment confirmation
            const deploymentMessage = document.createElement('div');
            deploymentMessage.className = 'success-banner';
            deploymentMessage.style.margin = '20px 0';
            deploymentMessage.innerHTML = `
                <h4>Contract Sent to Remix IDE</h4>
                <p>Your contract has been opened in Remix IDE.</p>
                <p>Please complete these steps in the new tab:</p>
                <ol>
                    <li>Go to the Solidity Compiler tab and click "Compile"</li>
                    <li>Switch to "Deploy & Run Transactions" tab</li>
                    <li>Set Environment to "Injected Provider - MetaMask"</li>
                    <li>Click "Deploy" to create your token</li>
                </ol>
            `;
            remixContainer.appendChild(deploymentMessage);
        });
        
        remixContainer.appendChild(openInRemixButton);
        remixContainer.appendChild(autoDeployButton);
    }

    // Add direct deploy button to the UI
    const directDeployButton = document.createElement('button');
    directDeployButton.id = 'direct-deploy-button';
    directDeployButton.textContent = 'Deploy to Filecoin';
    directDeployButton.classList.add('remix-button');
    directDeployButton.style.backgroundColor = '#0090ff';
    directDeployButton.style.marginLeft = '10px';

    directDeployButton.addEventListener('click', async function() {
        if (!window.contractDetails) {
            alert('Please generate a contract first');
            return;
        }
        
        const details = window.contractDetails;
        const contractCode = contractCodeElement.textContent;
        
        this.disabled = true;
        this.textContent = 'Deploying...';
        
        try {
            const address = await deployToFilecoin(
                contractCode, 
                details.name, 
                details.symbol, 
                details.decimals, 
                details.initialSupply
            );
            
            if (address) {
                alert(`Token deployed successfully to ${address}`);
                
                const deployedAddressElement = document.getElementById('deployed-contract-address');
                if (deployedAddressElement) {
                    deployedAddressElement.textContent = address;
                    document.getElementById('deployment-result-container').classList.remove('hidden');
                }
            }
        } catch (error) {
            console.error('Deployment failed:', error);
            alert(`Deployment failed: ${error.message}`);
        } finally {
            this.disabled = false;
            this.textContent = 'Deploy to Filecoin';
        }
    });

    document.getElementById('open-in-remix').parentNode.insertBefore(
        directDeployButton, 
        document.getElementById('open-in-remix').nextSibling
    );

    async function deployToFilecoin(contractCode, tokenName, tokenSymbol, tokenDecimals, initialSupply) {
        try {
            if (!window.ethereum) {
                throw new Error('MetaMask not detected. Please install MetaMask to deploy.');
            }
            
            const accounts = await window.ethereum.request({ method: 'eth_requestAccounts' });
            const account = accounts[0];
            
            const chainId = await window.ethereum.request({ method: 'eth_chainId' });
            if (chainId !== '0x13A' && chainId !== '0x4CB') { 
                try {
                    await window.ethereum.request({
                        method: 'wallet_switchEthereumChain',
                        params: [{ chainId: '0x4CB' }], 
                    });
                } catch (switchError) {
                    if (switchError.code === 4902) {
                        await window.ethereum.request({
                            method: 'wallet_addEthereumChain',
                            params: [{
                                chainId: '0x4CB',
                                chainName: 'Filecoin Calibration Testnet',
                                nativeCurrency: {
                                    name: 'tFIL',
                                    symbol: 'tFIL',
                                    decimals: 18
                                },
                                rpcUrls: ['https://api.calibration.node.glif.io/rpc/v1'],
                                blockExplorerUrls: ['https://calibration.filscan.io/']
                            }]
                        });
                    } else {
                        throw switchError;
                    }
                }
            }
            
            addDebugEntry('Connected to Filecoin network');
            addDebugEntry('Preparing for deployment...');
            
            const provider = new ethers.providers.Web3Provider(window.ethereum);
            const signer = provider.getSigner();
            
            const factory = new ethers.ContractFactory(
                [], 
                contractCode,
                signer
            );
            
            const contract = await factory.deploy();
            await contract.deployed();
            
            addDebugEntry(`Token deployed successfully!`);
            addDebugEntry(`Contract address: ${contract.address}`);
            
            return contract.address;
        } catch (error) {
            console.error('Deployment error:', error);
            addDebugEntry(`Deployment failed: ${error.message}`);
            return null;
        }
    }
});
