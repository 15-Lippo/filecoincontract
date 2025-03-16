document.addEventListener('DOMContentLoaded', function() {
    // DOM Elements
    const deployVmButton = document.getElementById('deploy-vm-button');
    const resultSection = document.getElementById('result-section');
    const vmSection = document.getElementById('vm-section');
    const vmBackButton = document.getElementById('vm-back-button');
    const deploymentProgressBar = document.getElementById('deployment-progress-bar');
    const deploymentStatus = document.getElementById('deployment-status');
    const deploymentResult = document.getElementById('deployment-result');
    const contractAddressElement = document.getElementById('contract-address');
    const txHashElement = document.getElementById('tx-hash');
    const gasUsedElement = document.getElementById('gas-used');
    const copyAddressButton = document.getElementById('copy-address');
    const copyTxButton = document.getElementById('copy-tx');
    const vmBlock = document.getElementById('vm-block');
    
    // Interaction elements
    const interactionMethod = document.getElementById('interaction-method');
    const addressParamGroup = document.getElementById('address-param-group');
    const amountParamGroup = document.getElementById('amount-param-group');
    const addressParam = document.getElementById('address-param');
    const amountParam = document.getElementById('amount-param');
    const executeInteractionButton = document.getElementById('execute-interaction');
    const interactionResult = document.getElementById('interaction-result');
    const interactionOutput = document.getElementById('interaction-output');
    
    // Contract data
    let contractName = '';
    let contractSymbol = '';
    let contractDecimals = 18;
    let contractAddress = '';
    let contractOwner = '';
    let contractTotalSupply = 0;
    let contractCode = '';
    
    // VM simulator state
    let blockNumber = 0;
    let tokenBalances = {};
    let vmInterval;
    
    // Show/hide parameter groups based on selected method
    interactionMethod.addEventListener('change', function() {
        const method = this.value;
        
        switch(method) {
            case 'balanceOf':
                addressParamGroup.classList.remove('hidden');
                amountParamGroup.classList.add('hidden');
                break;
            case 'transfer':
            case 'mint':
                addressParamGroup.classList.remove('hidden');
                amountParamGroup.classList.remove('hidden');
                break;
            case 'burn':
                addressParamGroup.classList.add('hidden');
                amountParamGroup.classList.remove('hidden');
                break;
        }
    });
    
    // Execute VM contract interaction
    executeInteractionButton.addEventListener('click', function() {
        const method = interactionMethod.value;
        const address = addressParam.value.trim();
        const amount = parseFloat(amountParam.value) || 0;
        
        executeVmInteraction(method, address, amount);
    });
    
    // Deploy to VM button handler
    deployVmButton.addEventListener('click', function() {
        // Get contract data from the hidden elements
        contractName = document.getElementById('result-token-name').textContent;
        contractSymbol = document.getElementById('result-token-symbol').textContent;
        contractCode = document.getElementById('contract-code').textContent;
        contractOwner = document.getElementById('owner-address').value.trim() || '0xf39Fd6e51aad88F6F4ce6aB8827279cffFb92266';
        
        // Extract decimals and initial supply from the contract code
        const decimalsMatch = contractCode.match(/_decimals = (\d+);/);
        if (decimalsMatch && decimalsMatch[1]) {
            contractDecimals = parseInt(decimalsMatch[1]);
        }
        
        const supplyMatch = contractCode.match(/_mint\([^,]+, (\d+[_\d]*)\);/);
        if (supplyMatch && supplyMatch[1]) {
            contractTotalSupply = parseInt(supplyMatch[1].replace(/_/g, ''));
        }
        
        // Show owner address in display
        document.getElementById('owner-display-address').textContent = shortenAddress(contractOwner);
        
        // Update total supply display
        document.getElementById('total-supply-display').textContent = formatTokenAmount(contractTotalSupply) + ' ' + contractSymbol;
        
        // Update owner balance display
        document.getElementById('owner-balance').textContent = formatTokenAmount(contractTotalSupply) + ' ' + contractSymbol;
        
        // Clone the logo for token card
        const resultLogoContainer = document.getElementById('result-logo-container');
        const tokenCardLogo = document.getElementById('token-card-logo');
        tokenCardLogo.innerHTML = resultLogoContainer.innerHTML;
        
        // Add debug entry
        addDebugEntry(`Deploying contract: ${contractName} (${contractSymbol})`);
        addDebugEntry(`Owner: ${contractOwner}`);
        addDebugEntry(`Initial Supply: ${contractTotalSupply / (10 ** contractDecimals)} ${contractSymbol}`);
        
        // Hide result section and show VM section
        resultSection.classList.add('hidden');
        vmSection.classList.remove('hidden');
        
        // Start deployment simulation
        startDeployment();
    });
    
    // VM back button handler
    vmBackButton.addEventListener('click', function() {
        // Stop the VM block interval
        if (vmInterval) {
            clearInterval(vmInterval);
        }
        
        // Reset the VM
        blockNumber = 0;
        vmBlock.textContent = '0';
        deploymentProgressBar.style.width = '0';
        deploymentStatus.textContent = 'Initializing VM environment...';
        deploymentResult.classList.add('hidden');
        
        // Hide VM section and show result section
        vmSection.classList.add('hidden');
        resultSection.classList.remove('hidden');
    });
    
    // Copy buttons
    copyAddressButton.addEventListener('click', function() {
        copyToClipboard(contractAddressElement.textContent);
        showCopiedFeedback(this);
    });
    
    copyTxButton.addEventListener('click', function() {
        copyToClipboard(txHashElement.textContent);
        showCopiedFeedback(this);
    });
    
    // Start VM deployment simulation
    function startDeployment() {
        // Reset deployment progress
        let progress = 0;
        deploymentProgressBar.style.width = '0%';
        deploymentStatus.textContent = 'Initializing VM environment...';
        deploymentResult.classList.add('hidden');
        
        // Generate random contract address
        contractAddress = '0x' + Array.from({length: 40}, () => 
            '0123456789abcdef'[Math.floor(Math.random() * 16)]
        ).join('');
        
        // Generate random transaction hash
        const txHash = '0x' + Array.from({length: 64}, () => 
            '0123456789abcdef'[Math.floor(Math.random() * 16)]
        ).join('');
        
        // Set initial token balance for owner
        tokenBalances[contractOwner] = contractTotalSupply;
        
        // Simulate deployment progress
        const deploymentSteps = [
            { progress: 10, status: 'Initializing Filecoin VM...' },
            { progress: 20, status: 'Compiling Solidity contract...' },
            { progress: 35, status: 'Optimizing bytecode...' },
            { progress: 50, status: 'Estimating gas costs...' },
            { progress: 65, status: 'Preparing deployment transaction...' },
            { progress: 80, status: 'Submitting to virtual machine...' },
            { progress: 90, status: 'Waiting for confirmation...' },
            { progress: 100, status: 'Deployment successful!' }
        ];
        
        let currentStep = 0;
        
        const deploymentInterval = setInterval(() => {
            if (currentStep < deploymentSteps.length) {
                const step = deploymentSteps[currentStep];
                deploymentProgressBar.style.width = step.progress + '%';
                deploymentStatus.textContent = step.status;
                currentStep++;
            } else {
                clearInterval(deploymentInterval);
                
                // Show deployment result
                contractAddressElement.textContent = contractAddress;
                txHashElement.textContent = txHash;
                gasUsedElement.textContent = Math.floor(Math.random() * 1000000) + 2000000;
                deploymentResult.classList.remove('hidden');
                
                // Start VM block simulator
                startVmBlockSimulation();
            }
        }, 800);
    }
    
    // Start VM block simulation
    function startVmBlockSimulation() {
        vmInterval = setInterval(() => {
            blockNumber++;
            vmBlock.textContent = blockNumber;
        }, 5000);
    }
    
    // Execute VM contract interaction
    function executeVmInteraction(method, address, amount) {
        // Convert token amount to raw amount with decimals
        const rawAmount = amount * (10 ** contractDecimals);
        
        let result = '';
        let success = true;
        let txHash = '';
        
        // Show loading state
        interactionResult.classList.remove('hidden');
        interactionOutput.textContent = 'Processing transaction...';
        
        // Simulate blockchain delay
        setTimeout(() => {
            switch(method) {
                case 'balanceOf':
                    if (!isValidAddress(address)) {
                        result = 'Error: Invalid address format';
                        success = false;
                    } else {
                        const balance = tokenBalances[address] || 0;
                        const formattedBalance = formatTokenAmount(balance);
                        result = `Balance of ${shortenAddress(address)}: ${formattedBalance} ${contractSymbol}`;
                    }
                    break;
                    
                case 'transfer':
                    if (!isValidAddress(address)) {
                        result = 'Error: Invalid address format';
                        success = false;
                    } else if (rawAmount <= 0) {
                        result = 'Error: Amount must be greater than 0';
                        success = false;
                    } else {
                        // Default sender is contract owner
                        const sender = contractOwner;
                        
                        // Check if sender has enough balance
                        if (!tokenBalances[sender] || tokenBalances[sender] < rawAmount) {
                            result = 'Error: Insufficient balance for transfer';
                            success = false;
                        } else {
                            // Update balances
                            tokenBalances[sender] -= rawAmount;
                            tokenBalances[address] = (tokenBalances[address] || 0) + rawAmount;
                            
                            result = `Transferred ${formatTokenAmount(rawAmount)} ${contractSymbol} to ${shortenAddress(address)}`;
                        }
                    }
                    break;
                    
                case 'mint':
                    if (!isValidAddress(address)) {
                        result = 'Error: Invalid address format';
                        success = false;
                    } else if (rawAmount <= 0) {
                        result = 'Error: Amount must be greater than 0';
                        success = false;
                    } else {
                        // Update balance
                        tokenBalances[address] = (tokenBalances[address] || 0) + rawAmount;
                        // Update total supply
                        contractTotalSupply += rawAmount;
                        
                        result = `Minted ${formatTokenAmount(rawAmount)} ${contractSymbol} to ${shortenAddress(address)}`;
                    }
                    break;
                    
                case 'burn':
                    if (rawAmount <= 0) {
                        result = 'Error: Amount must be greater than 0';
                        success = false;
                    } else {
                        // Default burner is contract owner
                        const burner = contractOwner;
                        
                        // Check if burner has enough balance
                        if (!tokenBalances[burner] || tokenBalances[burner] < rawAmount) {
                            result = 'Error: Insufficient balance to burn';
                            success = false;
                        } else {
                            // Update balance
                            tokenBalances[burner] -= rawAmount;
                            // Update total supply
                            contractTotalSupply -= rawAmount;
                            
                            result = `Burned ${formatTokenAmount(rawAmount)} ${contractSymbol}`;
                        }
                    }
                    break;
                    
                default:
                    // Add support for custom methods from the contract code
                    const methodMatch = contractCode.match(new RegExp(`function ${method}\\s*\\([^)]*\\)\\s*public`));
                    if (methodMatch) {
                        result = `Custom method ${method} executed successfully`;
                    } else {
                        result = `Error: Method ${method} not found in contract`;
                        success = false;
                    }
            }
            
            // Generate transaction hash for the operation
            txHash = '0x' + Array.from({length: 64}, () => 
                '0123456789abcdef'[Math.floor(Math.random() * 16)]
            ).join('');
            
            // Format the result with transaction details
            const timestamp = new Date().toISOString();
            const gasUsed = Math.floor(Math.random() * 100000) + 50000;
            
            const formattedResult = `${result}\n\nTransaction: ${shortenTxHash(txHash)}\nBlock: #${blockNumber}\nGas Used: ${gasUsed}\nTimestamp: ${timestamp}`;
            
            // Display the result
            interactionOutput.textContent = formattedResult;
            
            // Add to transaction history
            addTransactionToHistory(method, address, amount, txHash, success);
            
        }, 1500); // Simulate blockchain delay
    }
    
    // Add transaction to history
    function addTransactionToHistory(method, address, amount, txHash, success) {
        const historyContainer = document.getElementById('transaction-history-container');
        const txItem = document.createElement('div');
        txItem.className = `transaction-item ${success ? 'success' : 'failed'}`;
        
        const methodName = method.charAt(0).toUpperCase() + method.slice(1);
        let txDetails = `<strong>${methodName}</strong>`;
        
        if (method === 'balanceOf') {
            txDetails += ` ${shortenAddress(address)}`;
        } else if (method === 'transfer') {
            txDetails += ` ${formatTokenAmount(amount * (10 ** contractDecimals))} ${contractSymbol} to ${shortenAddress(address)}`;
        } else if (method === 'mint') {
            txDetails += ` ${formatTokenAmount(amount * (10 ** contractDecimals))} ${contractSymbol} to ${shortenAddress(address)}`;
        } else if (method === 'burn') {
            txDetails += ` ${formatTokenAmount(amount * (10 ** contractDecimals))} ${contractSymbol}`;
        }
        
        txItem.innerHTML = `
            <div class="tx-status ${success ? 'success' : 'failed'}"></div>
            <div class="tx-details">
                <div class="tx-info">${txDetails}</div>
                <div class="tx-hash">${shortenTxHash(txHash)}</div>
            </div>
            <div class="tx-time">${new Date().toLocaleTimeString()}</div>
        `;
        
        // Add to history (at the beginning)
        if (historyContainer.firstChild) {
            historyContainer.insertBefore(txItem, historyContainer.firstChild);
        } else {
            historyContainer.appendChild(txItem);
        }
        
        // Limit history to 5 items
        if (historyContainer.children.length > 5) {
            historyContainer.removeChild(historyContainer.lastChild);
        }
        
        // Show the history section if hidden
        document.getElementById('transaction-history').classList.remove('hidden');
    }
    
    // Helper functions
    function copyToClipboard(text) {
        navigator.clipboard.writeText(text).catch(err => {
            console.error('Failed to copy: ', err);
        });
    }
    
    function showCopiedFeedback(button) {
        const originalText = button.textContent;
        button.textContent = 'Copied!';
        setTimeout(() => {
            button.textContent = originalText;
        }, 2000);
    }
    
    function isValidAddress(address) {
        return /^0x[a-fA-F0-9]{40}$/.test(address);
    }
    
    function shortenAddress(address) {
        return address.substring(0, 6) + '...' + address.substring(address.length - 4);
    }
    
    function shortenTxHash(hash) {
        return hash.substring(0, 10) + '...' + hash.substring(hash.length - 8);
    }
    
    function formatTokenAmount(rawAmount) {
        const formattedAmount = rawAmount / (10 ** contractDecimals);
        return formattedAmount.toLocaleString(undefined, {
            minimumFractionDigits: 0,
            maximumFractionDigits: contractDecimals
        });
    }
    
    // Debug mode toggle
    const debugToggle = document.getElementById('debug-toggle');
    const debugPanel = document.getElementById('debug-panel');

    debugToggle.addEventListener('change', function() {
        if (this.checked) {
            debugPanel.classList.remove('hidden');
        } else {
            debugPanel.classList.add('hidden');
        }
    });

    // Add entry to debug panel
    function addDebugEntry(message) {
        const entry = document.createElement('div');
        entry.className = 'debug-entry';
        entry.textContent = `[${new Date().toLocaleTimeString()}] ${message}`;
        debugPanel.appendChild(entry);
        
        // Scroll to bottom
        debugPanel.scrollTop = debugPanel.scrollHeight;
    }
});
