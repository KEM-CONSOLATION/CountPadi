# Quick Setup Guide

## Step-by-Step Setup

### 1. Install Dependencies
```bash
npm install
```

### 2. Create Supabase Project

1. Go to [https://supabase.com](https://supabase.com)
2. Sign up or log in
3. Click "New Project"
4. Fill in:
   - **Name**: Restaurant Inventory (or any name)
   - **Database Password**: Choose a strong password (save it!)
   - **Region**: Choose closest to you
   - **Pricing Plan**: Free tier is fine

5. Wait for project to be ready (takes ~2 minutes)

### 3. Get Supabase Credentials

1. In your Supabase project dashboard, click **Settings** (gear icon)
2. Click **API** in the sidebar
3. Copy these values:
   - **Project URL** (under "Project URL")
   - **anon public** key (under "Project API keys")

### 4. Configure Environment Variables

1. Create `.env.local` file in the project root:
   ```bash
   cp .env.local.example .env.local
   ```

2. Open `.env.local` and paste your credentials:
   ```
   NEXT_PUBLIC_SUPABASE_URL=https://your-project.supabase.co
   NEXT_PUBLIC_SUPABASE_ANON_KEY=your-anon-key-here
   SUPABASE_SERVICE_ROLE_KEY=your-service-role-key-here
   ```

   **Important:** To get the service role key:
   - In Supabase dashboard, go to **Settings** → **API**
   - Copy the **service_role** key (NOT the anon key)
   - This is needed for admin operations like creating users
   - ⚠️ **Never expose this key in client-side code!**

### 5. Set Up Database Schema

1. In Supabase dashboard, click **SQL Editor** in the sidebar
2. Click **New Query**
3. Open `supabase/schema.sql` from this project
4. Copy **ALL** the SQL code
5. Paste it into the SQL Editor
6. Click **Run** (or press Cmd/Ctrl + Enter)

You should see "Success. No rows returned" - this is normal!

### 6. Create Admin User

**Option A: Via SQL Script (Recommended)**

1. Go to **SQL Editor** in your Supabase dashboard
2. Open the file `supabase/set_admin_user.sql` from this project
3. The script is already configured for `consolationlotachi@gmail.com`
4. If you need a different email, edit the script before running
5. Copy **ALL** the SQL code
6. Paste it into the SQL Editor and click **Run**

This will:
- Create the profile if it doesn't exist
- Set the role to `admin`

**Option B: Via Supabase Dashboard**

1. Go to **Authentication** → **Users**
2. Click **Add User** → **Create New User**
3. Enter:
   - Email: `consolationlotachi@gmail.com` (or your email)
   - Password: Choose a strong password
   - Auto Confirm User: ✅ (check this)
4. Click **Create User**
5. Go to **SQL Editor** and run:
   ```sql
   UPDATE profiles 
   SET role = 'admin' 
   WHERE email = 'consolationlotachi@gmail.com';
   ```

### 7. Create Additional Users

After logging in as admin, you can create users directly from the dashboard:

1. Log in to the admin dashboard
2. Go to **Admin View** → **Manage Users** tab
3. Click **+ Create User** button
4. Fill in:
   - Email
   - Password (minimum 6 characters)
   - Full Name (optional)
   - Role (Staff or Admin)
5. Click **Create User**

The user will be created and can log in immediately.

**Alternative: Via Supabase Dashboard**

1. Go to **Authentication** → **Users**
2. Click **Add User** → **Create New User**
3. Enter email and password
4. The trigger will automatically create a profile with `staff` role
5. You can change the role later in the admin dashboard

### 8. Add Some Inventory Items

1. Start the dev server:
   ```bash
   npm run dev
   ```

2. Open [http://localhost:3000](http://localhost:3000)
3. Log in with admin credentials
4. Go to **Admin View** → **Manage Items** tab
5. Add items like:
   - Rice (unit: kg)
   - Egusi (unit: kg)
   - Fufu (unit: pieces)
   - etc.

### 9. Test the System

1. Log in as staff member
2. Record opening stock for today
3. Record some sales
4. Record closing stock
5. Log in as admin and view the activities

## Troubleshooting

### "Missing Supabase environment variables" error
- Make sure `.env.local` exists and has correct values
- Restart the dev server after creating `.env.local`

### "relation does not exist" error
- Make sure you ran the SQL schema in Supabase SQL Editor
- Check that all tables were created (go to Table Editor)

### Can't log in
- Make sure you created the user in Supabase Authentication
- Check that the user exists in the `profiles` table
- Try resetting password in Supabase dashboard

### RLS Policy errors
- Make sure you ran the complete schema.sql file
- Check that RLS is enabled on tables (Table Editor → Table Settings)

### "Failed to invite user: Database error saving new user" error
This error occurs when inviting users through Supabase Auth. To fix it:

1. Go to **SQL Editor** in your Supabase dashboard
2. Open the file `supabase/fix_user_invite_trigger.sql` from this project
3. Copy **ALL** the SQL code
4. Paste it into the SQL Editor
5. Click **Run** (or press Cmd/Ctrl + Enter)

This will update the trigger function to properly handle user invitations with better error handling.

**Note:** If you haven't run the initial schema yet, the updated `schema.sql` file already includes this fix, so you don't need to run the migration separately.

### Can't change user roles in admin dashboard
If you get permission errors when trying to change user roles:

1. Go to **SQL Editor** in your Supabase dashboard
2. Open the file `supabase/add_profile_update_policy.sql` from this project
3. Copy **ALL** the SQL code
4. Paste it into the SQL Editor
5. Click **Run** (or press Cmd/Ctrl + Enter)

This adds the necessary permission for admins to update user profiles.

**Note:** If you're setting up fresh, the updated `schema.sql` file already includes this policy.

### Login works but redirects back to login page
This happens when a user was created manually in Supabase before the trigger was set up, so they don't have a profile. To fix:

1. Go to **SQL Editor** in your Supabase dashboard
2. Open the file `supabase/create_missing_profiles.sql` from this project
3. Copy **ALL** the SQL code
4. Paste it into the SQL Editor
5. Click **Run** (or press Cmd/Ctrl + Enter)

This will create profiles for all existing users who don't have one.

**Note:** Users cannot create their own profiles for security. Only authorized users (created through signup with the trigger, or manually by admin) can access the system.

### Disabling public signup (optional)
If you want to prevent new users from signing up on their own:

1. Go to **Authentication** → **Settings** in Supabase dashboard
2. Under **Auth Providers**, disable **Email** signup
3. Or use **Email Templates** to customize the signup flow

Users can still be invited by admins through the Supabase dashboard, and the trigger will automatically create their profile.

## Next Steps

- Customize the items list for your restaurant
- Train staff on how to use the system
- Set up daily routines for opening/closing stock
- Consider deploying to Vercel for production use

