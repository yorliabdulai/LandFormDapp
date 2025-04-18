
# 🌍 LandForm Frontend

A modern, scalable, and responsive **Web3 Land Ownership DApp** frontend built with **React + Vite**, styled using **TailwindCSS**, and powered by **Wagmi**, **RainbowKit**, and **React Query**.

![License](https://img.shields.io/badge/license-MIT-blue.svg)
![Build](https://img.shields.io/badge/build-passing-brightgreen)
![Vite](https://img.shields.io/badge/vite-frontend-lightblue)
![TypeScript](https://img.shields.io/badge/TypeScript-Ready-blue.svg)

---

## ✨ Features

- ⚡️ Fast bundling with **Vite**
- 🎨 Elegant UI using **TailwindCSS** & **Lucide Icons**
- 🦄 Web3 wallet connection via **RainbowKit**
- 🔐 IPFS file storage via **ipfs-http-client**
- 📊 Interactive charts with **Recharts**
- 🔁 Global state management using **React Query**
- 🧠 Smart caching and server-state management with **TanStack Query**
- 📦 Form handling with **React Hook Form**
- 🔥 Hot reload and Toast notifications
- 📱 Mobile-responsive & clean design

---

## 🚀 Getting Started

### ⚙️ Prerequisites

- Node.js >= 18.x
- pnpm / yarn / npm

### 🛠 Installation

```bash
git clone https://github.com/your-org/landdappfrontend.git
cd landdappfrontend
npm install
```
## 🔐 Environment Setup

Create a `.env` file in the root directory and add your variables:

```env
VITE_APECHAIN_PRIVATE_KEY= your_apechain_private_key
VITE_APECHAIN_RPC_URL=your_apechain_rpc_url
VITE_APECHAIN_EXPLORER_URL= your_apechain_explore_url
VITE_WALLETCONNECT_PROJECT_ID= your_wallet_id
VITE_APECHAIN_CHAIN_ID= your_chain_id
VITE_CONTRACT_ADDRESS= your_contract_address
VITE_ADMIN_ADDRESS= admin_address
VITE_FILEBASE_API_KEY= your_filebase_api_key
VITE_FILEBASE_API_SECRET= your_filebase_api_secret_key
```
### 🔧 Scripts

| Command       | Description                            |
|---------------|----------------------------------------|
| `npm run dev` | Start development server ⚡             |
| `npm run build` | Build the app for production 📦       |
| `npm run preview` | Preview production build 🧪        |
| `npm run lint` | Run ESLint on project files 🔍        |
| `npm run format` | Format code using Prettier ✨       |

---

## 🧩 Tech Stack

| Layer       | Stack |
|-------------|-------|
| 🧑‍💻 Frontend | `React`, `TypeScript`, `Vite` |
| 🎨 Styling | `TailwindCSS`, `DaisyUI`, `Lucide-React` |
| 🔗 Web3 | `wagmi`, `viem`, `RainbowKit`, `@reown/appkit` |
| 📡 State Mgmt | `React Query` |
| 📂 Forms | `React Hook Form` |
| 📊 Charts | `Recharts` |
| 🧪 Dev Tools | `ESLint`, `Prettier`, `Tailwind Prettier Plugin` |

---

## 🌐 Web3 Integrations

- ✅ WalletConnect
- ✅ MetaMask & other EVM wallets
- ✅ IPFS Storage
- ✅ Chain Support via `wagmi/chains`

---

## 📁 Project Structure

```
├── src/
│   ├── components/
│   ├── pages/
│   ├── hooks/
│   ├── store/
│   ├── utils/
│   └── main.tsx
├── public/
├── tailwind.config.js
├── vite.config.ts
└── package.json
```

---

## 💡 Contribution

We welcome all contributions! Feel free to open an issue, suggest a feature or fork and submit a PR.

1. 🍴 Fork the repository  
2. 🛠 Create a feature branch (`git checkout -b feat/your-feature`)  
3. ✅ Commit your changes (`git commit -m 'feat: your feature'`)  
4. 📬 Push to the branch (`git push origin feat/your-feature`)  
5. 🔁 Open a Pull Request

---

## 🧠 License

This project is licensed under the **MIT License**.  
Feel free to use, share, and adapt with attribution.

---

## ✨ Acknowledgements

- [RainbowKit](https://www.rainbowkit.com/)
- [Wagmi.sh](https://wagmi.sh/)
- [Reown](https://reown.xyz/)
- [React Query](https://tanstack.com/query)
- [Vite](https://vitejs.dev/)
- [Lucide Icons](https://lucide.dev/)
- [Tailwind CSS](https://tailwindcss.com/)

---

## 🙌 Author

Built with ❤️ by the LandForm Team.  
Let’s build the future of land verification and ownership onchain 🚀
