# 🚀 Calculator.sol - Smart Contract Deployment Guide

## ✅ Frontend Ready!

El frontend ya está completamente listo:
- ✓ Calculadora unificada (sin cambios de modo)
- ✓ Acepta operaciones simples y complejas
- ✓ Botón "Connect Wallet" para MetaMask
- ✓ Integrado con Ethers.js
- ✓ Listo para conectar con el contrato

---

## 📋 Próximos Pasos: Deployar el Contrato

### 1. **Instalar Dependencias**

```bash
npm install hardhat @openzeppelin/contracts
npx hardhat
```

Selecciona "Create a JavaScript project"

### 2. **Crear la carpeta del contrato**

```bash
mkdir contracts
mv Calculator.sol contracts/
```

Copia `contracts/Calculator.sol` a la carpeta del proyecto Hardhat.

### 3. **Compilar el contrato**

```bash
npx hardhat compile
```

Esto generará el ABI y bytecode.

### 4. **Deployar en Sepolia Testnet**

#### a) Crear archivo `.env`:

```
SEPOLIA_RPC_URL=https://sepolia.infura.io/v3/YOUR_INFURA_KEY
PRIVATE_KEY=your_metamask_private_key
```

⚠️ **Cómo obtenerlos:**
- **INFURA_KEY**: Regístrate gratis en [Infura.io](https://www.infura.io/)
- **PRIVATE_KEY**: En MetaMask → Settings → Security & Privacy → Export Private Key

#### b) Crear script de deployment (`scripts/deploy.js`):

```javascript
const hre = require("hardhat");

async function main() {
  const Calculator = await hre.ethers.getContractFactory("Calculator");
  const calculator = await Calculator.deploy();
  await calculator.waitForDeployment();
  
  const address = await calculator.getAddress();
  console.log("✓ Calculator deployed to:", address);
}

main()
  .then(() => process.exit(0))
  .catch((error) => {
    console.error(error);
    process.exit(1);
  });
```

#### c) Configurar Hardhat (`hardhat.config.js`):

```javascript
require("dotenv").config();
require("@nomicfoundation/hardhat-toolbox");

module.exports = {
  solidity: "0.8.34",
  networks: {
    sepolia: {
      url: process.env.SEPOLIA_RPC_URL,
      accounts: [process.env.PRIVATE_KEY]
    }
  }
};
```

#### d) Deployar:

```bash
npx hardhat run scripts/deploy.js --network sepolia
```

### 5. **Configurar `src/js/config.js` (¡IMPORTANTE!)**

**Este archivo contiene información sensible y NO debe subirse a GitHub.**

```bash
# Copia el archivo de ejemplo
cp src/js/config.example.js src/js/config.js
```

Edita `src/js/config.js` con tus valores reales:

```javascript
export const CONFIG = {
  SEPOLIA_RPC: 'https://sepolia.infura.io/v3/TU_INFURA_KEY_AQUI',
  CONTRACT_ADDRESS: '0xTU_DIRECCION_DEL_CONTRATO_AQUI',
  NETWORK_ID: 11155111,
};
```

**🔒 SEGURIDAD:**
- `config.js` está en `.gitignore` - no se subirá a GitHub
- Solo `config.example.js` se sube (como plantilla)
- Cada usuario debe crear su propio `config.js` localmente

### 6. **Obtener ETH de Testnet (Gratis)**

Ve a: [Sepolia Faucet](https://sepoliafaucet.com/)
- Pega tu dirección MetaMask
- Recibirás 0.5 ETH gratis para hacer transacciones

---

## 🎯 Usar la Calculadora

1. Abre `index.html` con un servidor local (Live Server)
2. Haz clic en "🔗 Connect Wallet"
3. Aprueba la conexión en MetaMask
4. ¡Usa la calculadora! Cada operación es una transacción en Sepolia

---

## 📚 Recursos

- [Sepolia Faucet](https://sepoliafaucet.com/) - Obtener ETH gratis
- [Infura.io](https://www.infura.io/) - RPC gratis
- [MetaMask](https://metamask.io/) - Wallet
- [Ethers.js Docs](https://docs.ethers.org/v6/)
- [Hardhat Docs](https://hardhat.org/getting-started)

---

## ❓ FAQ

**P: ¿Cómo sé si el contrato está deployado?**
R: Verifica en [Sepolia Etherscan](https://sepolia.etherscan.io/) con la dirección del contrato

**P: ¿Qué pasa si cambio de red en MetaMask?**
R: El navegador te avisa. Asegúrate de estar en Sepolia.

**P: ¿Las operaciones cuestan gas?**
R: Sí, pero en Sepolia testnet es gratis (no tiene valor real).

---

## ✨ Todo listo para GitHub

Después de deployar:
1. Actualiza `web3.js` con la dirección
2. Sube a GitHub
3. ¡Comparte tu calculadora blockchain! 🚀
