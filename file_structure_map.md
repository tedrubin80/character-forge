# 📁 D&D Creator Hub - Complete File Structure

## 🗂️ **Root Directory Structure**

```
your-project-root/
│
├── index.php                    # Main application file
├── reset.php                    # Password reset utility (optional)
├── test_html.html              # Test page (optional)
├── admin-styles.css            # Admin panel styles (optional)
│
├── 📁 js/                      # JavaScript files directory
│   ├── utils.js                # Utility functions
│   ├── theme.js                # Theme management
│   ├── auth.js                 # Authentication manager
│   ├── app.js                  # Main app controller
│   ├── charactercreator.js     # Character creator module
│   ├── campaignmanager.js      # Campaign manager module
│   ├── diceroller.js           # Dice roller module
│   ├── bg3tracker.js           # BG3 tracker module
│   └── adminpanel.js           # Admin panel module
│
├── 📁 api/                     # PHP API files directory
│   ├── auth.php                # Authentication API
│   ├── characters.php          # Character management API
│   ├── campaigns.php           # Campaign management API
│   ├── bg3.php                 # BG3 data management API
│   ├── dice.php                # Dice statistics API
│   └── analytics.php           # Analytics tracking API
│
└── 📁 data/                    # Data storage (auto-created)
    ├── passwords.json          # Password storage
    ├── access.log             # Access logs
    ├── 📁 characters/         # Character data files
    ├── 📁 campaigns/          # Campaign data files
    ├── 📁 bg3/               # BG3 playthrough data
    ├── 📁 dice/              # Dice roll logs
    └── 📁 analytics/         # Analytics data
```

## 🔧 **Required Files (Must Have)**

### **Root Directory:**
- ✅ `index.php` - Main application

### **js/ Directory:**
- ✅ `utils.js` - Core utility functions
- ✅ `theme.js` - Theme management
- ✅ `auth.js` - Authentication
- ✅ `app.js` - Main app controller
- ✅ `charactercreator.js` - Character module
- ✅ `campaignmanager.js` - Campaign module  
- ✅ `diceroller.js` - Dice module
- ✅ `bg3tracker.js` - BG3 module
- ✅ `adminpanel.js` - Admin module

### **api/ Directory:**
- ✅ `auth.php` - Authentication API
- ✅ `characters.php` - Character API
- ✅ `campaigns.php` - Campaign API
- ✅ `bg3.php` - BG3 API
- ✅ `dice.php` - Dice API
- ✅ `analytics.php` - Analytics API

## 📋 **File Naming Rules**

### ✅ **Correct Naming (No Underscores):**
- `charactercreator.js`
- `campaignmanager.js`
- `diceroller.js`
- `bg3tracker.js`
- `adminpanel.js`

### ❌ **Incorrect Naming (With Underscores):**
- ~~`character_creator.js`~~
- ~~`campaign_manager.js`~~
- ~~`dice_roller.js`~~
- ~~`bg3_tracker.js`~~
- ~~`admin_panel.js`~~

## 🔍 **How to Verify Your Structure**

### **1. Check JavaScript Files:**
```bash
ls js/
# Should show: utils.js, theme.js, auth.js, app.js, 
# charactercreator.js, campaignmanager.js, diceroller.js, 
# bg3tracker.js, adminpanel.js
```

### **2. Check API Files:**
```bash
ls api/
# Should show: auth.php, characters.php, campaigns.php, 
# bg3.php, dice.php, analytics.php
```

### **3. Test File Access:**
Open in browser:
- `yoursite.com/js/utils.js` - Should show JavaScript code
- `yoursite.com/api/auth.php?action=check_auth` - Should show JSON response

## 🚨 **Common Issues & Solutions**

### **Problem: "Module not found" errors**
**Solution:** Check file paths in `index.php`:
```html
<script src="js/diceroller.js"></script>
```

### **Problem: "Class not defined" errors**  
**Solution:** Ensure files load in correct order:
1. utils.js (first)
2. Module classes
3. app.js (last)

### **Problem: API errors**
**Solution:** Check `api/` folder permissions and file existence

## 🎯 **Quick Setup Checklist**

- [ ] All JS files in `js/` directory
- [ ] All PHP files in `api/` directory  
- [ ] No underscores in filenames
- [ ] `index.php` script paths point to `js/`
- [ ] File permissions set correctly (readable by web server)
- [ ] `data/` directory exists and is writable

## 🔧 **If You Need to Rename Files**

### **JavaScript Files (in js/):**
```bash
# If you still have underscored names, rename them:
mv character_creator.js charactercreator.js
mv campaign_manager.js campaignmanager.js
mv dice_roller.js diceroller.js
mv bg3_tracker.js bg3tracker.js
mv admin_panel.js adminpanel.js
```

### **Update index.php Script Tags:**
Make sure your `index.php` has:
```html
<script src="js/charactercreator.js"></script>
<script src="js/campaignmanager.js"></script>
<script src="js/diceroller.js"></script>
<script src="js/bg3tracker.js"></script>
<script src="js/adminpanel.js"></script>
```

This structure should resolve all the module loading issues! 🐉✨