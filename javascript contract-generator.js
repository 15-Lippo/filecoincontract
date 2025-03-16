// Update the generateERC20Contract function
function generateERC20Contract(name, symbol, decimals, initialSupply, ownerAddress) {
    const supplyWithDecimals = initialSupply * (10 ** decimals);
    return `// SPDX-License-Identifier: MIT
pragma solidity ^0.8.0;

import "https://github.com/OpenZeppelin/openzeppelin-contracts/blob/v4.8.0/contracts/token/ERC20/ERC20.sol";
import "https://github.com/OpenZeppelin/openzeppelin-contracts/blob/v4.8.0/contracts/access/Ownable.sol";

contract ${name.replace(/\s+/g, '')} is ERC20, Ownable {
    uint8 private _decimals;

    constructor() ERC20("${name}", "${symbol}") {
        _decimals = ${decimals};
        _mint("${ownerAddress}", ${supplyWithDecimals});
    }

    function decimals() public view virtual override returns (uint8) {
        return _decimals;
    }
}

// Add this new initRemixIDE function
function initRemixIDE(contractCode) {
    const remixContainer = document.getElementById('remix-container');
    const config = {
        container: remixContainer,
        server: {
            port: 8080,
            enabled: false
        },
        editor: {
            darkMode: true
        }
    };

    // Create Remix IDE instance
    const remix = new RemixIDE(config);

    // Create a new file in Remix
    remix.loadFile('MyToken.sol', contractCode);

    // Setup compiler events
    remix.on('compileComplete', (bytecode) => {
        console.log('Contract compiled successfully');
        remix.Compiler.setCompilationTarget('bytecode');
    });

    // Show Remix IDE
    remixContainer.style.display = 'block';
}
