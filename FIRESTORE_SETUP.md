# Fixing "Missing or insufficient permissions" Error

This error occurs because your Cloud Firestore Security Rules are blocking write access. Since your application uses a custom admin login instead of Firebase Authentication, you need to open your database rules for development.

## 1. Go to Firebase Console
Open your project in the [Firebase Console](https://console.firebase.google.com/project/highlaban-833fc/firestore/rules).

## 2. Navigate to Firestore Rules
1. Click **Build** > **Firestore Database** in the left sidebar.
2. Click the **Rules** tab at the top.

## 3. Update the Rules
Replace the existing rules with the following configuration to allow read/write access:

```javascript
rules_version = '2';
service cloud.firestore {
  match /databases/{database}/documents {
    match /{document=**} {
      allow read, write: if true;
    }
  }
}
```

## 4. Publish
Click the **Publish** button to apply the changes.

> [!WARNING]
> **Security Note**: These rules make your database publicly accessible. This is fine for development, but before launching to production, you should implement proper Firebase Authentication and restrict these rules.
