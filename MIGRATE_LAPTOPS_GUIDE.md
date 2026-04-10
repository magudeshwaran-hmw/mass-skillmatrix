# 💻 Complete Laptop Migration Guide: Zensar Skill Navigator

This guide contains **everything** you need to successfully move this project to a brand new laptop without losing any data or configuration.

---

## 🟢 PHASE 1: WHAT TO DO ON YOUR **CURRENT** LAPTOP

Before moving to the new laptop, you MUST back up your database so you don't lose the employee records and skills.

### 1. Back up the PostgreSQL Database
1. Open the project folder on this current laptop.
2. Double-click the file named `1_BACKUP_DATABASE.bat` (which has just been created for you).
3. If it is successful, it will generate a file named `skillmatrix_backup.sql` in your project folder. 
   *(Note: if the script can't find pg_dump, you will have to open pgAdmin4, right-click the `skillmatrix` database -> Backup -> Format: Plain text).*

### 2. Copy the Project to a Pendrive
Copy the ENTIRE `zensar-skillmatrix` folder (including the newly created `skillmatrix_backup.sql` file) to a USB flash drive or external hard drive. 
*Tip: You can delete the `node_modules` folder inside your project folder before copying to make the pendrive transfer 100x faster, since `node_modules` is huge and will be rebuilt anyway.*

---

## 🔵 PHASE 2: WHAT TO INSTALL ON YOUR **NEW** LAPTOP

Before the code can run on the new laptop, you MUST install these 3 core softwares:

### 1. Install Node.js (To run the code)
- Download from: https://nodejs.org/ (Download the "LTS" version)
- Install it using default settings.

### 2. Install PostgreSQL (For the database)
- Download from: https://www.postgresql.org/download/windows/
- **CRITICAL INSTALLATION SETTINGS:**
  - Password for postgres user: `Hmw@81323`
  - Port number: `1234`
  - *Make sure to remember this, otherwise the server will crash trying to connect.*

### 3. Install Ollama (For AI Resume Extraction)
- Download from: https://ollama.com/download/windows
- Install it.
- Open your terminal/command prompt and run this command:
  `ollama run deepseek-v3.1:671b-cloud` (Make sure to run the model name you use locally).

---

## 🟣 PHASE 3: AUTOMATED SETUP ON THE **NEW** LAPTOP

Once you have copied the folder from your pendrive to your new laptop, follow these steps to instantly restore everything.

### 1. Initialize the Database
1. Open **pgAdmin4** on the new laptop.
2. Login with your password (`Hmw@81323`).
3. Right-click on Databases -> Create -> Database. Name it exactly: `skillmatrix`
4. Right-click the new `skillmatrix` database -> **Restore**.
5. Select the `skillmatrix_backup.sql` file you copied over from the old laptop. Click Restore. All your data is back!

### 2. Run the Automated Installer
Double-click the newly created `2_NEW_LAPTOP_SETUP.bat` file in your project folder. 
This will automatically:
- Check if Node is installed.
- Install all required `npm` dependencies.

### 3. Start the Project
Finally, double-click the `START_ALL.bat` file to launch the backend server and frontend preview just like you do on this laptop!

---

## ⚙️ TECHNICAL TROUBLESHOOTING CHEATSHEET

If something fails to connect on the new laptop, check these 3 things in the `.env` file (found in the root directory):
```env
DB_HOST=localhost
DB_PORT=1234
DB_USER=postgres
DB_PASSWORD=Hmw@81323
DB_NAME=skillmatrix
```
*(If you installed Postgres on standard port 5432 by accident on the new laptop instead of 1234, simply change `DB_PORT=5432` in the root `.env` file).*
