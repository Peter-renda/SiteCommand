# Project Directory: User Permissions Overview

Within the **Project-level Directory**, the **Users** tab shows all user accounts created for the project. When a user is added to a project directory, that account is also included in the **Company-level Directory** automatically.

In the users table, you can see each user’s:
- Name
- Address
- Contact information
- Invitation status (including options to invite or re-invite users to log in)

Use the three-dot menu in the top-right corner of the table to show, hide, or reorder columns. You can also use the search toolbar to find specific users, group records, and apply filters.

## Add a New User

To add a new user to the project directory:
1. Enter the user’s contact information.
2. Select a **Project Permission Template**.
3. Click **Add** to create the user.

A user’s project access is primarily controlled by role-based permission templates. Different roles—such as general contractor, superintendent, architect, and specialty teams—typically require different templates.

Using templates helps:
- Standardize permissions across jobs
- Reduce manual setup
- Maintain consistency for common roles

For this example, select the **Subcontractor** template and click **Add**.

## User Profile Page

After creating the user, you are taken to the user profile page. Here you can:
- Add personal details
- Add company information
- Review project permission templates
- View and adjust email notifications

The **Project Permission Templates** table may appear greyed out if a template was already selected during user creation.

## Permission Levels

Within each template, each tool can be assigned one of four permission levels:
- **None**
- **Read Only**
- **Standard**
- **Admin**

### None
If a user has **None** on a tool, they do not see that tool or its data. They also cannot participate in any items tied to that tool.

Example: If the user has **None** on **Budget**, the Budget tool is not visible in navigation and no budget information appears on the Home page.

### Read Only
Users with **Read Only** can view and download public items but cannot:
- Create items
- Edit items
- Be assigned responsibility

Example: A user can open the **Drawings** tool but cannot upload or edit drawings.

### Standard
Users with **Standard** can:
- View tool data
- Be assigned to items
- Respond to items
- Create items in some tools

In many workflows, items created by Standard users may still require review by an Admin user.

Example: With **Standard** on **Submittals**, a user can view and create submittals for review/approval.

### Admin
**Admin** is the highest access level. Admin users can:
- Create and edit items
- Assign items to Standard/Admin users
- Move items to the recycle bin
- Change tool configuration settings
- Mark items as private

Private items are visible to:
- Admin users
- Specifically designated Read Only and Standard users

Example: With **Admin** on **Punch List**, a user can create/edit items and manage tool settings from the gear icon.

## Who Can Edit User Permissions

Only users with **Admin** on the Project Directory can directly adjust an individual user’s permission levels.

Read Only or Standard users must have granular **Create Users** and **Edit Users** permissions to assign a permission template.

## Final Reminder

Always click **Save** at the bottom of the page after editing user information.
