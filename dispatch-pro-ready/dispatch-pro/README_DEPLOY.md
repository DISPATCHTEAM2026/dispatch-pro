# Road Service Dispatch Pro - Deploy Guide

This project is ready for Vercel + Firebase.

## 1. Firebase Setup
1. Go to Firebase Console and create a project.
2. Create a Web App inside the Firebase project.
3. Enable Authentication > Sign-in method > Email/Password.
4. Create each dispatcher under Authentication > Users.
5. Enable Firestore Database.
6. Start Firestore in Production Mode, then use these rules initially:

```
rules_version = '2';
service cloud.firestore {
  match /databases/{database}/documents {
    match /jobs/{jobId} {
      allow read, write: if request.auth != null;
    }
  }
}
```

## 2. Environment Variables
Copy `.env.example` to `.env` locally and fill values from Firebase Web App config.
In Vercel, add the same variables under Project Settings > Environment Variables.

## 3. Run Locally
```
npm install
npm run dev
```

## 4. Deploy to Vercel
1. Create a GitHub repo and upload this folder.
2. Go to Vercel > Add New Project.
3. Import the GitHub repo.
4. Framework preset: Vite.
5. Add environment variables.
6. Deploy.

## 5. Custom Domain
In Vercel > Project > Settings > Domains, add:
`dispatch.yourdomain.com`
Then add the DNS record that Vercel gives you.

## Included Features
- Email/password login through Firebase Auth
- Live Firestore jobs table
- Add jobs in real time
- Update job status
- Delete jobs
- Search and filter jobs
- Dashboard metrics
- City performance summary
- CSV export
- Responsive web layout
