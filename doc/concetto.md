### Abstract
Pictochat is a messaging application designed specifically to support adolescents with communication challenges. Originally assigned as a semester project, the app was created as a React-based web application and relies on Telegram’s infrastructure via a python server for message sending, receiving, and storage. The core mission of Pictochat is to streamline social interactions between young people or between young people and their families by offering an intuitive **AI-powered response suggestion tool**. This tool simplifies conversation by suggesting suitable replies in the form of pictograms. Additionally, Pictochat features a message creation tool using pictograms and an automatic text-to-pictogram conversion, ensuring that users can understand any incoming message in a visually supportive format.

<div class="page"/>

### Pictochat Thesis Concept

## Basic Information
- **App Name**: Pictochat
- **Developer**: Carlo Pezzotti

## Introduction
Pictochat is a communication app specifically designed to aid young people with communication difficulties, facilitating their ability to engage socially with peers, family, or caregivers. Initially developed in React as a semester project, the application leverages **Telegram’s backend** for its messaging capabilities, managing message storage, delivery, and security. This integration with Telegram enables Pictochat to provide a reliable and familiar messaging experience while allowing the app’s core features to focus on accessibility and ease of use for adolescents with unique communication needs.

The app’s primary goal is to make social interactions as simple as possible by:
1. **Providing AI-suggested responses** in pictogram format, helping users quickly and easily reply in a way that suits their abilities.
2. **Offering a pictogram-based message creation tool** to support users in building messages visually.
3. **Converting incoming text messages to pictograms** so that all content can be presented in a visually accessible format.

Pictochat aims to be an effective tool for both individual and family communication, leveraging intuitive design, artificial intelligence, and pictograms to improve communication experiences.

## Thesis Objectives

### 1. AI-Powered Pictogram Suggestions
   - **Description**: Develop an **AI-driven system** capable of analyzing incoming prompts or questions and suggesting relevant pictogram-based responses. This AI system uses **Natural Language Processing (NLP)** to interpret input, identify key phrases, and map them to pictograms based on a set of commonly used words and phrases, drawing from **ARASAAC** (Aragonese Portal for Augmentative and Alternative Communication) to ensure each response has a visual counterpart.
   - **Approach**:
     - **Data Integration with ARASAAC**: The AI will source a range of standard responses from ARASAAC’s pictogram library, ensuring that each suggested response has an associated pictogram for clear communication.
     - **NLP Model Implementation**: An NLP model will parse common questions and statements, identify keywords, and generate a selection of appropriate pictograms. The system will prioritize light, efficient processing to enable real-time responsiveness within a frontend framework.
   - **Expected Outcome**: The AI system will provide highly relevant pictogram suggestions for a range of common conversational prompts, enhancing the speed and ease with which users can reply.

<div class="page"/>

### 2. Pictogram-Based Message Creation Tool
   - **Objective**: Develop a tool that allows users to create their own messages using pictograms, offering a library of symbols from which they can select to form complete thoughts visually.
   - **Expected Outcome**: A user-friendly interface for composing pictogram-based messages, helping users communicate more expressively without needing to type.

### 3. Text-to-Pictogram Conversion for Incoming Messages
   - **Objective**: Integrate an automated system that converts text-based messages into pictograms, ensuring that every message users receive is accessible in a visual, easily interpretable format.
   - **Expected Outcome**: A reliable conversion system that translates text into pictograms for full message comprehension, using ARASAAC’s library as a standardized reference.

### 4. Frontend Development Focused on User Accessibility
   - **Objective**: Refine the app’s frontend to be fully self-sufficient, relying solely on Telegram’s backend for messaging infrastructure but ensuring all AI and accessibility tools are integrated within the client-side framework.
   - **Expected Outcome**: A seamless, frontend-only app that enhances user accessibility without requiring extensive backend resources.

### 5. Additional Accessibility and Usability Features
   - **Profile Image Personalization**: Enable users to upload profile images, making interactions more personal and identifiable.
   - **Real-Time Notifications**: Develop a notification system for incoming messages, with configurable alerts.
   - **Auditory Feedback**: Add sound effects for key actions, such as sending or receiving a message, to enhance user engagement and signal important updates.

---

## Thesis Focus: Developing AI for Pictogram Suggestions
The primary focus of this thesis will be the development of the **AI module for pictogram-based response suggestions**. This component is critical to Pictochat’s mission, as it provides quick, meaningful response options for users. The AI will leverage NLP to detect keywords in user input, identifying appropriate pictograms from the ARASAAC database that correspond with typical conversational themes. This system will not only streamline communication but also offer an inclusive way for adolescents with communication challenges to participate in conversations more naturally and intuitively.

<div class="page"/>

## Project Structure and Methodology
The thesis project will be completed through a series of structured phases:
1. **Frontend Development and Telegram Integration**: Establish the core messaging functionality using Telegram’s backend while focusing on client-side capabilities.
2. **User Interface and Feature Enhancements**: Implement tools for pictogram-based message creation, text-to-pictogram conversion, and profile customization.
3. **AI Integration and Testing**: Build, test, and refine the AI model for suggesting pictograms, ensuring high relevance and accuracy.
4. **User Testing and Validation**: Conduct usability tests, focusing on AI performance and user experience for accessibility.
5. **Documentation and Analysis**: Document findings, evaluate the AI’s impact, and suggest potential improvements.

---

## Conclusion
Pictochat represents a meaningful advancement in accessible communication technology, combining frontend development and AI to offer an intuitive messaging experience for users with unique communication needs. By transforming text into pictograms and suggesting visual responses, the app enables users to communicate naturally and easily, supporting more inclusive and effective social interactions.