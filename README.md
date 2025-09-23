
# Project: Real-World Online Poll System

## Overview
This project is a full-stack, real-world online polling platform that simulates both frontend and backend development for applications requiring real-time data processing, interactive user experience, and scalable architecture. It is designed to give developers hands-on experience with:

- Building scalable APIs and real-time voting systems (backend)
- Developing interactive, real-time applications with live data updates (frontend)
- Managing complex state and dynamic visualizations

---

## Architecture
The system is divided into two main components:

**Frontend:**
- Built with React/React Native, Redux, TypeScript, and a charting library
- Communicates with the backend via RESTful APIs
- Deployed on Vercel or Netlify

**Backend:**
- Built with Django (Python) and PostgreSQL
- Provides RESTful APIs for poll management, voting, and real-time result computation
- API documentation is provided via Swagger and hosted at `/api/docs`
- Deployed on a cloud platform (e.g., Heroku, AWS, or similar)

---

## Tech Stack

| Layer     | Technology                |
|-----------|---------------------------|
| Frontend  | React/React Native, Redux, TypeScript, Chart.js (or similar) |
| Backend   | Django, PostgreSQL, Swagger |
| Deployment| Vercel/Netlify (frontend), Heroku/AWS (backend) |

---

## Features

### Frontend
- **Poll Creation and Voting:**
	- Users can create polls with customizable options
	- Users can vote on active polls and share them
- **Real-Time Results Display:**
	- Fetch and display live poll results as votes are submitted
	- Charts update dynamically without page refresh
- **Dynamic Visualizations:**
	- Engaging, responsive charts for poll results
- **Form Validation:**
	- Validates poll creation forms and provides user-friendly error messages

### Backend
- **Poll Management:**
	- APIs to create polls with multiple options, including metadata (creation date, expiry)
- **Voting System:**
	- APIs for users to cast votes, with validations to prevent duplicate voting
- **Result Computation:**
	- Real-time calculation of vote counts for each option, optimized for scalability
- **API Documentation:**
	- Swagger documentation for all endpoints, hosted at `/api/docs`

---
