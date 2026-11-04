# Penpot MCP Server - Usage Examples

Collection of practical usage examples. Copy and use these in Claude Desktop!

---

## 🎨 Example 1: Creating a Modern Login Screen

### Step 1: Create Project Structure

```
Create a new login screen project with the following steps:

1. Create a project named "Login UI Project"
2. Create a file named "Modern Login Screen"
3. Add two pages:
   - "Desktop (1920x1080)"
   - "Mobile (375x812)"
```

### Step 2: Design Desktop Login Screen

```
Create a login screen on the Desktop page with the following layout:

**Overall Layout (1920x1080)**
1. Create main container frame

**Left Area (50%, gradient background)**
1. Frame size: 960x1080
2. Background: Gradient (top-left #667eea → bottom-right #764ba2)
3. Center text:
   - "Welcome to" (24px, white, 80% opacity)
   - "Your Design Space" (48px, white, bold)
   - Subtitle: "Create, collaborate, and inspire" (16px, white, 60% opacity)

**Right Login Form Area (50%, white background)**
1. Frame size: 960x1080
2. Center login form (400px width):

   a. Logo area
      - Circle icon (64x64, #4F46E5 background)
      - 32px bottom margin

   b. Title
      - "Welcome Back" (32px, #1F2937, bold)
      - "Please enter your details" (14px, #6B7280)
      - 40px bottom margin

   c. Email input field
      - Label: "Email" (14px, #374151)
      - Input box: 400x48px
      - Background: #F9FAFB
      - Border: 1px #E5E7EB
      - Corners: 8px
      - Placeholder: "Enter your email"
      - 20px bottom margin

   d. Password input field
      - Label: "Password" (14px, #374151)
      - Input box: 400x48px (same style as email field)
      - Placeholder: "Enter your password"
      - 16px bottom margin

   e. Options row
      - Checkbox + "Remember me" (left aligned)
      - "Forgot password?" link (right aligned, #4F46E5)
      - 24px bottom margin

   f. Login button
      - Size: 400x48px
      - Background: #4F46E5 (indigo)
      - Text: "Sign In" (16px, white, center aligned)
      - Corners: 8px
      - 24px bottom margin

   g. Divider
      - "OR" text (gray)
      - 24px bottom margin

   h. Social login buttons
      - Google button (400x48px, white background, gray border)
      - GitHub button (400x48px, white background, gray border)
      - 12px bottom margin each

   i. Sign up prompt
      - "Don't have an account? Sign up" (14px, center aligned)
      - "Sign up" part in #4F46E5 color
```

### Step 3: Create Reusable Components

```
Create reusable components from the following elements in the login form:

1. Primary Button component
   - Name: "Button/Primary"
   - Use current "Sign In" button

2. Input Field component
   - Name: "Input/Text"
   - Use email input field

3. Social Button component
   - Name: "Button/Social"
   - Use Google button
```

### Step 4: Create Mobile Version

```
Create a mobile login screen on the Mobile page:

**Overall Layout (375x812 - iPhone 13 Pro)**
1. Main container frame

**Content (vertical layout)**
1. Top area (200px height)
   - Gradient background (#667eea → #764ba2)
   - Logo circle (80x80, center aligned)
   - "Welcome Back" (24px, white)

2. Login form (bottom area)
   - Background: white
   - Rounded top corners only (24px)
   - Padding: 24px
   - Contents:
     * Email input (100% width, 48px height)
     * Password input (100% width, 48px height)
     * Remember me checkbox
     * Login button (100% width, 48px height)
     * OR divider
     * 2 social login buttons
     * Sign up prompt
```

---

## 🎯 Example 2: Creating a Dashboard UI

### Basic Structure

```
Create a new dashboard design:

**File Creation**
- Name: "Admin Dashboard"
- Page: "Main Dashboard" (1440x900)

**Layout Structure**
1. Left sidebar (280px width)
   - Background: #1F2937 (dark gray)
   - Logo area (top)
   - Navigation menu items
   - Profile card at bottom

2. Main content area (remaining width)
   - Top header (64px height)
     * Search bar
     * Notification icon
     * Profile avatar

   - Statistics card row (4 cards)
     * Each card: 240x120px
     * Icon + title + number + growth rate

   - Chart area
     * 2 chart frames (side by side)
```

---

## 📱 Example 3: Mobile App Screen Set

### Onboarding Flow

```
Create 3 mobile app onboarding screens:

**File**: "Mobile App Onboarding"

**Page 1: Welcome**
- Frame: 375x812
- Top 2/3: Illustration area (gradient background)
- Bottom 1/3:
  * Title: "Welcome to App"
  * Description text
  * "Next" button
  * 3 page indicator dots (first one active)

**Page 2: Features**
- Same layout
- Different gradient colors
- Feature description text
- Page indicator (second active)

**Page 3: Get Started**
- Same layout
- "Get Started" button (Primary)
- "Skip" button (Secondary)
- Page indicator (third active)
```

---

## 🎨 Example 4: Building a Design System

### Color Palette

```
Create a design system color palette:

**File**: "Design System - Colors"

**Primary colors**
- 9 shades from 900 (#312E81) to 50 (#EEF2FF)
- Display each as 80x80 square
- Include color code text

**Secondary colors**
- Same approach

**Neutral colors**
- Gray scale from white to black

**Semantic colors**
- Success: green tones
- Warning: yellow tones
- Error: red tones
- Info: blue tones
```

### Typography Scale

```
Create a typography scale:

**Headings**
- H1: 48px, bold
- H2: 40px, bold
- H3: 32px, bold
- H4: 24px, medium
- H5: 20px, medium
- H6: 16px, medium

**Body**
- Body Large: 18px, regular
- Body: 16px, regular
- Body Small: 14px, regular

**Others**
- Caption: 12px, regular
- Overline: 10px, uppercase

Display each text style with example text
```

### Button Component Set

```
Create a button component library:

**By size**
- Large: 48px height
- Medium: 40px height
- Small: 32px height

**By style**
- Primary (blue background)
- Secondary (gray background)
- Outline (border only)
- Ghost (no background)
- Danger (red)

**By state**
- Default
- Hover
- Active
- Disabled

Total: 5(styles) x 3(sizes) x 4(states) = 60 button variations
Create each as a component
```

---

## 📊 Example 5: Data Visualization Screen

### Chart Dashboard

```
Create a data chart dashboard:

**File**: "Analytics Dashboard"

**KPI Card Row**
1. 4 statistics cards (horizontal layout)
   - Total users card
   - Active sessions card
   - Revenue card
   - Conversion rate card

**Chart Area**
1. Line chart frame (large)
   - Title: "User Growth"
   - Axis labels
   - Grid lines
   - Legend

2. Bar chart frame
   - Title: "Revenue by Product"

3. Donut chart frame
   - Title: "Traffic Sources"
   - Total in center

4. Table frame
   - Title: "Recent Transactions"
   - Header row
   - 5 data rows
```

---

## 🎭 Example 6: E-commerce Product Card

### Product Grid

```
Create an e-commerce product listing screen:

**Layout**: 1440x900

**Header**
- Logo (left)
- Search bar (center)
- Cart icon (right)

**Filter Sidebar** (left, 240px)
- Category filter
- Price range slider
- Brand checkboxes
- Color selection
- "Apply Filters" button

**Product Grid** (main area)
- 3x3 grid (9 products)
- Each product card:
  * Image area (320x320, gray background)
  * Product name (16px)
  * Price (20px, bold)
  * Star rating
  * "Add to Cart" button
  * "Quick View" overlay on hover

**Create product card as component**
- Name: "Product Card"
```

---

## 💬 Example 7: Chat Interface

### Messenger UI

```
Create a messenger chat screen:

**Layout**: 1200x800

**Left Sidebar** (320px)
- Search bar
- Conversation list (scrollable)
- Each conversation item:
  * Profile photo (40x40 circle)
  * Name
  * Last message preview
  * Time
  * Unread message badge

**Main Chat Area**
- Top header:
  * Contact profile + name
  * Call icons

- Message area:
  * Received messages (left aligned, gray background)
  * Sent messages (right aligned, blue background)
  * Time displayed for each message
  * Profile photos included

- Bottom input area:
  * Attachment button
  * Text input field
  * Emoji button
  * Send button
```

---

## 🎨 Advanced Techniques

### Gradient Utilization

```
Create cards with various gradient backgrounds:

1. Sunset gradient (#FF6B6B → #FFE66D)
2. Ocean gradient (#667EEA → #764BA2)
3. Forest gradient (#134E5E → #71B280)
4. Purple Dream (#A770EF → #CF8BF3 → #FDB99B)
5. Dark Mode (#2C3E50 → #34495E)

Each card: 400x300px
Gradient direction: top-left → bottom-right
```

### Shadow Effects

```
Create cards with various shadow levels:

- Level 1: Subtle shadow (0 1px 3px rgba(0,0,0,0.12))
- Level 2: Small shadow (0 4px 6px rgba(0,0,0,0.1))
- Level 3: Medium shadow (0 10px 20px rgba(0,0,0,0.15))
- Level 4: Large shadow (0 20px 40px rgba(0,0,0,0.2))
- Level 5: Floating effect (0 30px 60px rgba(0,0,0,0.25))

Display "Shadow Level X" text on each card
```

### Animation States

```
Represent various button states:

**Interactive Button States**
1. Default State
   - Background: #4F46E5
   - Text: white
   - Shadow: small

2. Hover State
   - Background: #4338CA (slightly darker)
   - Shadow: medium

3. Active/Pressed State
   - Background: #3730A3 (darker)
   - Shadow: minimal
   - Shifted down slightly (2px)

4. Disabled State
   - Background: #E5E7EB (gray)
   - Text: #9CA3AF
   - Cursor: not-allowed
   - Shadow: none

Arrange each state side by side for comparison
```

---

## 🔄 Workflow Example

### From Prototype to Completion

```
Step 1: Wireframe
"Create a basic wireframe for the login screen"
- Layout represented with gray boxes only
- Labels and basic shapes only

Step 2: Apply Styling
"Apply design system colors and typography to the wireframe"
- Add colors
- Adjust font sizes
- Refine spacing

Step 3: Componentize
"Convert reusable elements into components"
- Buttons
- Input fields
- Cards

Step 4: Responsive Versions
"Create tablet and mobile versions"
- 768px (tablet)
- 375px (mobile)

Step 5: Interaction States
"Create hover, active, and disabled states for each component"

Step 6: Dark Mode
"Create a dark mode version of the entire screen"
```

---

## 💡 Tips and Best Practices

### Efficient Design Work

1. **Component First**

   ```
   First: "Create basic components like buttons, input fields, and cards"
   Then: "Use these components to build the login screen"
   ```

2. **Use Color Variables**

   ```
   "Define Primary color as #4F46E5 and use this color for all important buttons"
   ```

3. **Consistent Spacing**

   ```
   "Use an 8px grid system to organize element spacing"
   ```

4. **Hierarchical Structure**
   ```
   "Create logical groups with frames: Header, Content, Footer"
   ```

---

For more examples, please request them in GitHub Discussions!
