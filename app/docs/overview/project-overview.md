# MathQuest Project Overview

## Introduction

MathQuest is an educational platform designed to make learning mathematics engaging and interactive through gamified quiz experiences. It enables teachers to create custom math quizzes and tournaments, while providing students with both real-time and self-paced learning opportunities.

## Core Features

### For Teachers

- **Quiz Creation**: Create customizable math quizzes with different question types, difficulty levels, and topics
- **Tournament Management**: Set up competitive tournaments with leaderboards and time constraints
- **Student Analytics**: Track student progress and identify areas for improvement
- **Question Bank**: Access and contribute to a shared repository of math questions

### For Students

- **Real-time Participation**: Join live quiz tournaments and compete with peers
- **Self-paced Learning**: Take quizzes at their own pace in "differed" mode
- **Progress Tracking**: View personal performance statistics and improvement over time
- **Leaderboards**: Compare performance with peers through tournament rankings

## Technical Architecture

MathQuest is built as a modern web application with:

- **Frontend**: Next.js React application with TypeScript
- **Backend**: Node.js server with Socket.IO for real-time communication
- **Database**: PostgreSQL database accessed via Prisma ORM
- **Shared**: Common types and utilities shared between frontend and backend

## Development Focus

The project is currently undergoing several improvements:

1. **TypeScript Migration**: Converting legacy JavaScript code to TypeScript
2. **Type System Enhancement**: Creating a robust shared type system
3. **Architecture Refactoring**: Improving code organization and reducing duplication
4. **Socket Communication**: Standardizing real-time communication patterns

## Educational Philosophy

MathQuest is built on the belief that learning is most effective when it's engaging and interactive. By introducing game-like elements to mathematics education, the platform aims to:

1. Increase student motivation and engagement
2. Provide immediate feedback to reinforce learning
3. Enable teachers to identify and address knowledge gaps
4. Foster healthy competition and collaboration among students

## Target Audience

- **Primary Users**: Middle and high school mathematics teachers and students
- **Secondary Users**: Educational institutions, tutoring centers, and homeschool educators

## Related Documentation

- [Setup Guide](../setup/README.md) - Getting started with development
- [Architecture Overview](../architecture/README.md) - Technical architecture details
- [Project Roadmap](../project/roadmap.md) - Future development plans
