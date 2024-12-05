# PictoChat: Empowering Communication through Pictograms

## Table of Contents
1. [Introduction](#introduction)
2. [Features](#features)
3. [Technology Stack](#technology-stack)
4. [Installation](#installation)
5. [Usage](#usage)
6. [Contributing](#contributing)
7. [License](#license)
8. [Contact](#contact)

---

## Introduction
**PictoChat** is an innovative Progressive Web Application (PWA) designed to simplify communication for individuals with cognitive difficulties. By integrating **pictograms** into messaging, users can express themselves more effectively and intuitively. PictoChat leverages the APIs of **Telegram**, combining text-based and image-based communication into a seamless and inclusive experience.

This project addresses critical communication challenges faced by the **MindTime Foundation** users, bridging the gap between individuals who struggle with traditional text-based methods and their families, friends, and peers.

---

## Features

### Core Capabilities:
- **Hybrid Communication**: Messages can be sent and received as both text and pictograms.
- **Pictogram Encoding and Decoding**: Converts text into pictograms and vice versa, ensuring clarity.
- **Custom Pictograms**: Users can upload personalized pictograms for tailored communication.
- **Infinitive Verb Recognition**: Detects and processes verbs in their base forms for accurate pictogram matching.

### Messaging Enhancements:
- **Pictogram-Only Communication**: Compose and send messages entirely with pictograms.
- **Question-Response System**: Tailored responses to questions using predictive pictograms.
- **In-App Notifications**: Alerts for new messages, settings updates, and more.
- **Optimized Chat Experience**: Streamlined contact and message pages for performance and usability.

### Accessibility Features:
- **Parent Integration**: Parents can assign specific pictograms to words or phrases for better context.
- **Infinitely Scalable**: Supports caching for offline image access and zero server maintenance costs.
- **Cross-Platform Compatibility**: Built as a PWA for web and mobile access.

---

## Technology Stack

### Frontend:
- **React** (with TypeScript): Modular and maintainable architecture.
- **Ant Design**: Responsive and accessible UI components.
- **Framer Motion**: Smooth animations for a better user experience.
- **React Router DOM**: Simplified routing for intuitive navigation.

### Backend:
- **Telegram API**: Handles authentication and contact management.
- **ARAASAC API**: Fetches and integrates pictograms.

### Utilities and Libraries:
- **Infinite Scroll**: Efficient data loading for large contact/message lists.
- **Caching**: Local caching mechanisms for pictogram images.
- **Deployment**: Automated CI/CD via **GitHub Pages**.

---

## Installation

### Prerequisites:
- Node.js (>= 16.x)
- npm (>= 7.x)

### Steps:
1. **Clone the Repository:**
   ```bash
   git clone https://github.com/PezzottiCarlo/pictochat.git
   cd pictochat
   ```

2. **Install Dependencies:**
   ```bash
   npm install
   ```

3. **Start the Development Server:**
   ```bash
   npm run start
   ```

4. **Build for Production:**
   ```bash
   npm run build
   ```

5. **Deploy:**
   Deploy to GitHub Pages with:
   ```bash
   npm run deploy
   ```

---

## Usage

1. **Login with Telegram**:
   - Use your Telegram credentials to access your contact list securely.
   
2. **Message with Pictograms**:
   - Write or interpret messages using built-in pictogram support.
   - Customize messages with personalized pictograms.

3. **Access Settings**:
   - Adjust app preferences, manage custom pictograms, and explore advanced options.

4. **Real-Time Testing**:
   - Test new features in collaboration with the **MindTime Foundation**.

---

## Contributing

We welcome contributions to improve **PictoChat**! Follow these steps:
1. **Fork the Repository** on GitHub.
2. **Create a Feature Branch**:
   ```bash
   git checkout -b feature-name
   ```
3. **Commit Your Changes**:
   ```bash
   git commit -m "Add feature-name"
   ```
4. **Push to Your Branch**:
   ```bash
   git push origin feature-name
   ```
5. **Open a Pull Request** on GitHub.

---

## License

This project is licensed under the [MIT License](LICENSE). You are free to use, modify, and distribute it as long as proper attribution is provided.

---

## Contact

For inquiries, suggestions, or collaboration opportunities:
- **Author**: Carlo Pezzotti
- **Email**: [carlo.pezzotti@example.com](mailto:carlo.pezzotti@student.supsi.ch)
- **GitHub**: [PezzottiCarlo](https://github.com/PezzottiCarlo)

--- 

Thank you for supporting **PictoChat**! Together, we can make communication accessible to everyone.