# PROJECT SPECIFICATION: CPU AND GPU E-COMMERCE WEBSITE

## 1. Project Overview

**Deployment Scope and Scale (Live Demo):** The project is built as a functional product deployed on free cloud hosting (**Vercel**) backed by **Supabase** for live demonstration at university. All online payment steps, delivery progress tracking, and data management workflows are fully designed in terms of user experience, yet remain at a visual simulation level without integrating real banking payment gateways or actual commercial operations.

**Project Objective:** Build a specialized e-commerce website focused on selling the two core hardware components that determine personal computer processing performance: Central Processing Units (CPU) and Graphics Processing Units (GPU).

**Target Users:** Both general consumers and hardware enthusiasts looking to purchase new components, upgrade individual parts, or evaluate component performance and value before deciding on a CPU or GPU purchase.

**Interface Language:** The entire website interface is written in Vietnamese, because prices are in VND, delivery addresses are in Vietnam, and the store uses Zalo for customer support. Common hardware terms such as VRAM, TDP, socket, and benchmark remain in English. If the course later requires an English interface, the interface text can be switched without changing any other rule in this document. The presentation rules in Section 6 apply equally to the Vietnamese text.

**Product Catalog Scope:** The storefront exclusively sells and displays retail brand-new CPUs (Intel, AMD) and GPUs (NVIDIA, AMD) currently available on the market. Separately, the PSU Wattage Estimator is preloaded with a distinct, non-overlapping fixed reference group of legacy components, listed model by model in Appendix A (24 legacy CPU models and 33 base GPU series). Legacy components are strictly excluded from the storefront, never offered for sale, and exist solely as reference data so users can evaluate upgrade options against their existing hardware, while also allowing new or legacy reference entries to be added directly through the database at any time. The listed currency is Vietnamese Dong (VND), with static pricing and technical specifications manually entered to closely match actual data from reputable domestic hardware retailers.

**User Account Scope:** The project does not implement a user account system, meaning there are no registration, login, or member profile management features. Guest visitors accessing the website can freely add products to the shopping cart, compare components, use analytical tools, and place orders directly.

**Core Value:** Combine a streamlined online shopping experience with three specialized hardware analysis tools (**Product Specification Comparison**, **Performance-per-Price Ranking**, and **PSU Wattage Estimator**), enabling customers to compare specifications side by side, rank components by cost-efficiency within a target budget, and estimate required power supply wattage directly on the website.

## 2. Core E-commerce Features

### 2.1. Homepage (Storefront) and Quick Search

**Homepage:** Features a prominent top banner area (Hero section), showcases featured product categories (CPU and GPU), and provides quick access shortcuts to the three specialized tools.

**Search Bar and Instant Suggestions:** Positioned prominently, allowing users to enter keywords or component model names (such as CPU model names, GPU series, or manufacturers) and displaying live product suggestions while typing for immediate navigation to the product detail page.

### 2.2. Product Listing Page

**Categorization and Grouping:** Separates the two main categories into CPU and GPU, displaying only brand-new items currently for sale. Supports visual grouping by chip manufacturer (Intel, AMD, NVIDIA). For the GPU category on the storefront, products are listed individually by each commercial model from Add-in Board (AIB) partners (such as ASUS, MSI, Gigabyte) because each variant has distinct pricing, cooling designs, and product images.

**Information Displayed on Each Product Card:** Each card presents the product illustration image, full product name, listed selling price (in VND), key summary technical specifications, and a **"Compare"** (`So sánh`) button to add the product to the comparison bar.

**Multi-condition Filtering (Multi-filter):** General filters allow filtering by chip manufacturer (Intel, AMD, NVIDIA) and price range (in VND). GPU-specific filters allow filtering by VRAM capacity and AIB partner brand (such as ASUS, MSI, Gigabyte). CPU-specific filters allow filtering by socket type. The options shown in the VRAM, AIB partner brand, and socket filters are not fixed in advance. They are generated automatically from the products currently displayed on the storefront, so a filter option never appears without at least one matching product, a new capacity such as 32 GB appears as soon as the administrator adds a product with that capacity, and the lists update whenever the administrator adds or removes products.

**List Sorting:** Allows sorting products by selling price (ascending or descending) or by overall benchmark performance score, using the score standard defined in Section 3.0.

### 2.3. Product Detail Page

**Core Product Presentation:** Displays the product image, full model name, manufacturer, and listed selling price (in VND).

**Default Sales Information:** Stock status always defaults to **In Stock**. Both CPUs and GPUs come with a **3-year (36-month) warranty** and are sold strictly as retail boxed editions with complete accessories (**Full Box**), with no bare tray units (**Tray**) offered.

**Detailed Technical Specification Table:** Provides complete standardized specifications synchronized with the Product Specification Comparison tool criteria. Specifically for **GPUs**, the detail page includes an additional group of physical and connectivity specifications covering **card dimensions** (length in mm and thickness in PCIe slots) as well as **display output port counts** (HDMI and DisplayPort).

**Quick Action Buttons to Specialized Tools:** Contextual navigation buttons are placed directly on the product detail page (specifically **"Compare this model"** and **"Calculate PSU wattage"**). Clicking **"Compare this model"** adds the currently viewed storefront product to the comparison bar (or navigates to the comparison view). Clicking **"Calculate PSU wattage"** navigates to the PSU Wattage Estimator interface and **automatically pre-fills the currently viewed product** (automatically mapping to the base GPU series name if viewing a commercial AIB GPU variant).

### 2.4. Guest Cart, Checkout, Validation, and Order Tracking

**Shopping Cart Management:** Guest visitors can add products to the cart without logging in. The cart supports increasing or decreasing item quantities, removing individual items, automatically recalculating the total order value, and persisting cart state across page reloads in the visitor's own browser.

**Cart Synchronization with Catalog Changes:** Because cart and comparison selections are stored in browser `localStorage`, opening the cart, comparison bar, or checkout page automatically synchronizes selected product IDs against the latest active server catalog. If an administrator updates a product's price, the cart updates to the current price and notifies the visitor. If an administrator soft-deletes a product already sitting in a visitor's cart or comparison bar, the frontend removes the unavailable entry with a clear notice naming the discontinued item; if a stale or soft-deleted product ID is submitted during checkout, the backend rejects the request with a clear conflict notice listing the unavailable item name(s) so no order can be placed for deleted products.

**Cart Quantity and Empty-Cart Rules:**

* Each product in the cart accepts an integer quantity from **1 to 100**. Setting a product's quantity to **0** prompts a confirmation dialog to remove that item from the cart.

* A single shopping cart can hold a maximum of **20 distinct product entries**.

* When the cart is empty, the Checkout button is disabled. If a user navigates directly to the checkout URL with an empty cart, the system redirects back to the cart page with an informational notice, and the backend rejects any empty-cart checkout API request with HTTP status `400`.

**Checkout Form Fields and Validation Rules:** Buyers enter delivery details in the checkout form, validated on both the frontend and backend:

* **Full Name:** Required, **2 to 50 characters** after trimming leading and trailing whitespace; Vietnamese diacritics are permitted.

* **Phone Number:** Required, Vietnamese mobile numbers only. Input is normalized prior to validation by stripping spaces, dots, and hyphens, and converting a leading `+84` or `84` to `0`. The normalized string must match the regular expression `^0(3|5|7|8|9)\d{8}$`.

* **Shipping Address:** The system does not use any external map service, distance lookup table, or third-party administrative API. The buyer selects **Province/City**, **District**, and **Ward** from cascading dropdown menus powered by a local offline administrative dataset bundled with the application (ensuring live demos remain unaffected by external API outages), and enters the **House Number and Street Name** in a required detailed address text input (**10 to 200 characters**).

* **Delivery Notes:** Optional free-text input, maximum **300 characters**.

* **Server-Side Recalculation:** The backend re-validates all submitted form fields and recalculates all item unit prices, shipping fees, and final payable totals directly from the database. Any price figures sent from the client browser are ignored.

**Shipping Fee Calculation Rules:** Distance-based and district-based shipping tiers are not used. Shipping fees are determined strictly by total item quantity in the cart:

* **Free Shipping (0 VND):** Applies automatically whenever the cart contains **2 or more items in total quantity** ($\text{total quantity} \ge 2$), regardless of product category or delivery location.

* **Standard Flat Shipping (50,000 VND):** Applies whenever the order does not qualify for free shipping (i.e., total cart quantity is **1 item**), charged at a flat rate of **50,000 VND** for the entire order.

* The system automatically adds the calculated shipping fee (or displays Free Shipping) to the total payable order amount.

**Payment Method Selection:** Buyers select 1 of 3 payment options: Cash on Delivery (COD), Bank Transfer / QR Code, or International Card (Visa / Mastercard).

**5-Second Order Review Modal:** Immediately after selecting a payment method and submitting the checkout form, the system displays a 5-second review modal with a live countdown so the buyer can verify all order details and the shipping address. During this 5-second window, the modal provides a **"Cancel / Edit Order"** (*"Hủy / Quay lại sửa"*) button to return to the checkout form and a **"Confirm Immediately"** (*"Xác nhận ngay"*) button to bypass the remaining countdown during rapid live demo runs; if neither button is clicked, the modal automatically confirms and proceeds when the 5-second countdown completes.

**Simulated Payment Screens by Method:** For **COD**, the flow proceeds directly to the order completion screen and order status tracking board. For **Bank Transfer / QR Code**, the screen displays a QR code image alongside simulated bank transfer details (account number, account holder name, payment amount, and a standardized transfer reference simulating automatic memo population upon scanning), accompanied by a "Confirm Payment Completed" button. For **Visa / Mastercard**, the screen displays a simulated card input form that accepts any string of characters or digits (without validating real bank card formats) to keep live demo presentations fast and smooth, accompanied by a "Confirm Payment Completed" button.

**Double-Submit Prevention:** Final order submission actions (confirming COD after the review modal or clicking "Confirm Payment Completed") must disable the action button with a loading indicator while the request is in flight and prevent duplicate order creation from accidental double-clicks or repeated submissions of the same checkout attempt.

**Order Creation Timing and Order ID Format:**

* An order record is created only at the final step of checkout. For COD, the order is created immediately when the 5-second review modal confirms (either via countdown completion or clicking "Confirm Immediately"). For Bank Transfer / QR Code and Visa / Mastercard, the order is created only when the buyer clicks "Confirm Payment Completed". If the buyer cancels during the 5-second review modal or leaves in the middle of a payment screen, no order exists and the cart remains intact, eliminating the need for an "Awaiting Payment" status.

* Upon order creation, the system generates a unique **Order ID** formatted as `PC-` followed by **10 random uppercase alphanumeric characters** excluding visually ambiguous characters (`I`, `L`, `O`, `U`), generated via a cryptographically secure random number generator and verified against existing records for uniqueness (for example, `PC-7K3M9QX2TB`). Sequential order numbers are prohibited.

**Order Status Board and Stage Simulation:** Upon completing the order or confirming payment, the system displays the generated Order ID (with a prompt reminding the customer to save the ID) and a tracking board consisting of 5 sequential stages: **Order Placed**, **Preparing Order**, **In Transit**, **Out for Delivery**, and **Delivered Successfully**. A new order always starts at Order Placed. For live demo presentation purposes, the order status does not advance automatically over time and only moves to the next stage when the user clicks a visually distinct **`[Demo Control] Skip to next stage`** (*`[Demo Control] Chuyển trạng thái tiếp theo`*) button on the status board, clearly styled as a presentation simulation control so evaluators recognize it as an intentional demo feature rather than an authorization flaw. The button appears on the status board both right after placing an order and when an order is reopened through lookup. At the final stage, Delivered Successfully, the button is hidden and the board shows an "Order completed" message instead. The stage can never move backward.

**Order Data Snapshot:** Each order permanently stores the product names, prices, quantities, and shipping fee as they were at the moment the order was placed. Later price changes, edits, or removal of a product by the administrator never alter existing orders.

**Order Lookup and Security Controls:**

* Customers can reopen the order status tracking board at any time by submitting both their **Order ID** and the **Phone Number** (normalized using the checkout phone normalization rules) used during checkout.

* When no record matches both fields, the system always displays a single generic error message (**"No order found with this information"** / *"Không tìm thấy đơn hàng với thông tin này"*) without indicating which input field was incorrect.

* Failed lookup attempts are rate-limited to a maximum of **5 failed attempts within 15 minutes per IP address**.

* Displayed lookup results mask the customer's phone number (for example, `0912***789`).

## 3. Specialized Hardware Tools

**Analytical Scope and Disclaimer:** The three specialized tools evaluate only **relative performance**, **value for money (performance-per-price)**, and **recommended power supply wattage**. The system does **not** perform hardware compatibility verification (such as checking CPU socket, motherboard chipset, or RAM compatibility). All performance scores and wattage outputs are derived from simplified estimation models rather than real-world game benchmarks. Both the user interface and project documentation must clearly disclose the data source (PassMark) and these estimation limitations.

### 3.0. Benchmark Score and Power Data Standard

**Benchmark Score Source and Dynamic Normalization:** Benchmark scores for both CPUs and GPUs are sourced from PassMark. Each product record in the database stores its **raw PassMark score** together with the data source (PassMark). For user-facing display, sorting, comparison, and Performance-per-Price calculations, the backend dynamically normalizes scores within each category (CPU and GPU) against the highest raw PassMark score among active products in that category (setting the top product in each category to **100** and scaling all other products in the same category proportionally, rounded to 1 decimal place). Storing raw PassMark scores and normalizing dynamically guarantees that the 100-point scale remains consistent even when stronger products are added later. The interface also includes a concise note clarifying that PassMark scores represent overall multi-core / general compute performance rather than gaming-only frame rates.

**Power Data per Product and Reference Sourcing:** Every CPU stores a dedicated field named **PSU calculation power**, set to its maximum power under peak load (Maximum Turbo Power for Intel and PPT for AMD), because a CPU can draw significantly more power than its base TDP rating. Every GPU uses the official Total Board Power (TBP/TDP) specification. The PSU Wattage Estimator reads these two values, and the administrator can edit both fields in Admin Mode. During initial database seeding, power figures for all storefront models and all Appendix A legacy reference models must be looked up from reliable official manufacturer datasheets (Intel ARK, AMD Specifications, NVIDIA Specifications) or the TechPowerUp Database rather than estimated arbitrarily.

### 3.1. Tool 1: Product Specification Comparison

**Business Reference Websites:** TechPowerUp GPU Database, PassMark, and PCPartPicker.

**Purpose:** Enable buyers to select 2 to 3 products of the same category and compare their technical specifications, benchmark performance, and retail prices side by side.

**Selectable Data Source:** Exclusively includes **brand-new products currently sold on the storefront** (listing individual commercial AIB GPU models with their respective retail selling prices). Legacy reference components in Appendix A are excluded from this tool because they are not sold on the storefront and have no retail price.

**Selection and Sticky Comparison Bar Flow:**

1. Users add products to the comparison queue by clicking the **"Compare"** (`So sánh`) button on product cards in the storefront (or **"Compare this model"** on a product detail page).

2. A **sticky comparison bar** fixed at the bottom of the viewport displays the currently selected products, allows removing individual items or clearing the selection, and provides a button to launch the comparison view once **at least 2 products** are selected.

3. **Validation and Edge States:**

   * A user can select **up to 3 products of the same category** (CPU with CPU, or GPU with GPU).

   * Attempting to add a product from a different category displays the notice: **"Only products of the same category can be compared"** (*"Chỉ so sánh được các sản phẩm cùng loại"*).

   * Attempting to select more than 3 products displays a notification indicating that the maximum limit of 3 products has been reached.

   * Opening the comparison view with fewer than 2 products prompts the user to select at least 2 products.

**Comparison Page (`/compare?ids=a,b,c`) and Direct URL Validation:**

* Navigating to `/compare?ids=a,b,c` deduplicates repeated product IDs and validates all requested items against active storefront records before rendering the side-by-side specification table.

* If the URL contains nonexistent or soft-deleted product IDs, mixes CPU and GPU categories, or resolves to fewer than 2 or more than 3 unique valid products, the page displays a clear error state explaining the issue with a direct button to return to the storefront and re-select products, rather than rendering an incomplete or broken table.

* When valid (2 or 3 same-category active products), the table displays **product names** (hiding product images to maximize horizontal viewing space), all detailed technical criteria for the category, Selling Price (in VND), and normalized Benchmark Score (alongside raw PassMark score in parentheses).

* The system strictly presents objective figures and visual highlights without any subjective written commentary or editorial verdicts.

**Highlight Rules:** On rows marked for optimization, the cell(s) holding the best value across the compared products are visually **highlighted**:

* **Higher is Better (Unconditionally Highlighted):** Benchmark Score, Cores and Threads, Base Clock, Boost Clock, and L3 Cache Capacity (for CPUs); VRAM Capacity, Processing Cores, Base Clock, Boost Clock, and Memory Bus Width (for GPUs). The highest numeric value is highlighted directly across all compared products regardless of chip manufacturer or microarchitecture.

* **Lower is Better (Unconditionally Highlighted):** Selling Price and Power Consumption (TDP).

* **Informational Text Labels (Never Highlighted):** Architecture, Socket, Manufacturing Process, and Supported RAM Standard (for CPUs); Memory Type (for GPUs), because text attributes cannot be ranked numerically.

**Detailed GPU Comparison Criteria:**

| No. | Comparison Criterion | Display Description | Highlight Rule | 
| ----- | ----- | ----- | ----- | 
| 1 | Selling Price | Listed storefront retail price (unit: VND) | Lower is better | 
| 2 | Benchmark Score | Dynamically normalized PassMark score (base 100 scale, with raw score shown) | Higher is better | 
| 3 | VRAM Capacity | Graphics memory capacity (unit: GB) | Higher is better | 
| 4 | Processing Cores | CUDA Cores (for NVIDIA) or Stream Processors (for AMD) | Higher is better | 
| 5 | Power Consumption (TDP) | Maximum thermal design / total board power rating (unit: W) | Lower is better | 
| 6 | Base Clock | Standard operating clock speed (unit: MHz) | Higher is better | 
| 7 | Boost Clock | Maximum clock speed under heavy load (unit: MHz) | Higher is better | 
| 8 | Memory Type | Graphics memory chip generation (GDDR6, GDDR6X, GDDR7) | No | 
| 9 | Memory Bus Width | Memory interface bus width (unit: bit) | Higher is better | 

**Detailed CPU Comparison Criteria:**

| No. | Comparison Criterion | Display Description | Highlight Rule | 
| ----- | ----- | ----- | ----- | 
| 1 | Selling Price | Listed storefront retail price (unit: VND) | Lower is better | 
| 2 | Benchmark Score | Dynamically normalized PassMark score (base 100 scale, with raw score shown) | Higher is better | 
| 3 | Architecture | Processor microarchitecture name (Zen 5, Arrow Lake-S, Raptor Lake Refresh) | No | 
| 4 | Socket | Motherboard compatible socket standard (AM5, LGA1851, LGA1700) | No | 
| 5 | Manufacturing Process | Semiconductor fabrication process node (TSMC 4nm, Intel 7) | No | 
| 6 | Cores and Threads | Total core and thread counts, separating Performance Cores (P-Core) and Efficiency Cores (E-Core) if applicable | Higher is better (higher total core count, then higher total thread count) | 
| 7 | Base Clock | Standard operating clock frequency (unit: GHz) | Higher is better | 
| 8 | Boost Clock | Maximum single-core boost frequency (unit: GHz) | Higher is better | 
| 9 | Cache Memory | Formatted text showing L1, L2, and L3 Cache, backed by a dedicated numeric L3 Cache field (in MB) | Higher is better (evaluated strictly on numeric L3 Cache capacity in MB) | 
| 10 | Power Consumption (TDP) | Processor base thermal design power rating (unit: W) | Lower is better | 
| 11 | Supported RAM Standard | System memory generation and supported transfer speeds (DDR5-6400, DDR4-3200) | No | 

### 3.2. Tool 2: Performance-per-Price Ranking

**Business Reference Websites:** PassMark (Price Performance Charts) and PCPartPicker.

**Purpose:** Enable buyers to rank currently available components within a selected category and optional maximum budget to identify which models deliver the highest benchmark performance per unit of currency.

**Selectable Data Source:** Exclusively includes **brand-new products currently sold on the storefront** (listing individual commercial AIB GPU models with their respective retail selling prices). Legacy reference components in Appendix A are excluded from this tool because they are not sold on the storefront and have no retail price.

**User Flow and Budget Filtering Rules:**

1. The user selects a hardware category (**CPU** or **GPU**), optionally filters by chip manufacturer (**Intel**, **AMD**, or **NVIDIA** as applicable to the category), and optionally enters a **maximum budget in VND**.

2. When a maximum budget is specified, the system includes only active storefront products in that category whose selling price is less than or equal to the entered budget. When the budget input is left blank, all active storefront products in that category (matching any selected manufacturer filter) are ranked.

3. If no active storefront products match the selected budget and manufacturer criteria, the interface displays a clear empty-state notice (*"Không có sản phẩm phù hợp với mức ngân sách đã chọn"*) rather than an error state.

**Calculation and Ranking Rules:**

* **Performance-per-Price Score Formula:**

  $$
  \text{Performance-per-Price Score} = \frac{\text{Benchmark Score (Normalized Base 100)}}{\text{Selling Price (in million VND)}}
  $$

  A higher score indicates greater performance per unit of currency.

* Matching products are ranked in descending order of their **Performance-per-Price Score**. When two or more products share the same rounded Performance-per-Price Score, ties are broken by lower selling price first, and then by higher raw PassMark score.

* The top-ranked product (or all products tied for the highest Performance-per-Price Score) is awarded a **"Best Value"** (*"Đáng tiền nhất"*) badge.

* The ranking table displays the rank position, product name (with a direct link to the product detail page), chip manufacturer, listed selling price (in VND), normalized Benchmark Score (alongside raw PassMark score in parentheses), and the **Performance-per-Price Score**, strictly without subjective written commentary or editorial verdicts.

### 3.3. Tool 3: PSU Wattage Estimator

**Business Reference Websites:** Newegg Power Supply Calculator and MSI Power Supply Calculator.

**Purpose:** Help customers determine a safe minimum power supply unit (PSU) rating when buying or upgrading a CPU and GPU.

**Selectable Data Source:** Combines all brand-new retail products currently sold on the storefront with the completely distinct legacy reference component dataset in Appendix A (plus any additional legacy reference entries added via Admin Mode). Because legacy components and retail storefront products are maintained as separate, non-overlapping datasets, all retail models and legacy reference models are listed cleanly without overlap. Unlike the storefront and the Product Specification Comparison tool (which list individual commercial card models by AIB partner), GPU selection in the PSU Wattage Estimator normalizes storefront GPUs to their **base GPU series name** (such as RTX 5070 or RX 9070 XT, without splitting into ASUS, MSI, or Gigabyte variants) alongside the legacy base GPU series in Appendix A.

**User Flow:** First, the user simultaneously selects **1 CPU model** and **1 base GPU series name** from the combined dataset. Second, the system calculates and returns the minimum recommended PSU wattage.

**Calculation Rules:** The recommended wattage is estimated using the following formula, where the CPU value is the **PSU calculation power** and the GPU value is the total board power (both defined in Section 3.0), $100\text{W}$ reserves power for baseline system components (motherboard, RAM, storage, fans), and $1.25$ applies a $25\%$ safety headroom against transient spikes and voltage drops under peak loads:

$$
\text{Recommended Wattage} = (\text{CPU PSU Calculation Power} + \text{GPU Total Board Power} + 100\text{W}) \times 1.25
$$

The resulting wattage is rounded up to the nearest standard commercial PSU capacity tier available on the market: **450W, 550W, 650W, 750W, 850W, 1000W, and 1200W**, and the interface always displays the exact calculated wattage figure alongside the recommended commercial tier:

* **Result At or Below 450W:** Any calculated wattage less than or equal to 450W is rounded up to the minimum recommended commercial tier of **450W**, displayed together with the exact calculated figure.
* **Result Above 1200W:** If the calculated wattage exceeds 1200W, the tool displays **"Above 1200W"** together with the exact calculated figure and a short note stating that a power supply with a higher capacity than common retail tiers is required. The tool never suggests specific PSU products.

## 4. Admin Mode

**Access Control, Credential Security, and Login Rate-Limiting:** Provides an Admin Mode toggle button directly on the website interface, protected by password authentication. The administrator password is configured via the `ADMIN_PASSWORD` environment variable (in `.env`), never hardcoded in source code and never committed to the source repository. Password verification is executed on the backend using cryptographic hash storage/comparison. To prevent brute-force password guessing, failed administrator login attempts are rate-limited to a maximum of **5 failed attempts within 15 minutes per IP address**.

**Direct Web Database and Order Management:** Allows the administrator to manage two strictly separated hardware groups directly through the web interface without needing external database management tools: (1) **Storefront Retail Products** (new CPUs and AIB GPUs for sale, including model names, selling prices, product images, manufacturer categories, detailed specifications, raw PassMark benchmark scores with their source and date, TDP values, and CPU PSU calculation power), and (2) **Legacy Reference Components** (non-retail legacy CPUs and legacy base GPU series used exclusively in the PSU Wattage Estimator). Legacy reference entries cannot be converted into retail storefront products and retail products cannot be converted into legacy entries. Admin Mode also includes an **Order List View** displaying all placed orders (Order ID, customer full name, phone number, total payable amount, current status stage, and creation timestamp) with direct links to open each order's tracking board during demonstrations.

**Product Image Input Options:** When adding or editing a product in Admin Mode, the administrator can either **paste an external image URL** or **upload an image file directly from their computer** (stored persistently in **Supabase Storage**, with the resulting public URL saved in the database, because Vercel serverless functions do not provide persistent local disk storage).

**Sample Data Reset for Public Demo:** Admin Mode provides a **"Reset Sample Data"** (*"Khôi phục dữ liệu mẫu"*) action button that performs a complete environment reset for live demonstrations: restoring the product catalog and legacy reference seed records to their default baseline state, **deleting all placed orders**, and **purging any non-seed uploaded images from Supabase Storage**.

**Strict Base GPU Inheritance for AIB Variants:** Minor factory-overclock differences across AIB cards are ignored; all commercial AIB GPU variants strictly follow the core specifications of their parent base GPU series. When adding or viewing an AIB GPU product, the record dynamically inherits all core technical specifications (VRAM capacity, processing cores, TDP/TBP rating, base clock, boost clock, memory type, memory bus width, and raw PassMark benchmark score) directly from the linked **base GPU series**, while the administrator only manages variant-specific attributes (full commercial model name, AIB partner brand, selling price, product image, card dimensions, and display output port counts). Updating a base GPU series automatically reflects across all of its attached AIB variants. Legacy reference GPUs in Appendix A remain exclusively at the base GPU series level and never have AIB variants.

**Deletion Rules:** Deleting a product is a soft delete. The product disappears from the storefront, specialized tools, search, and filters, while its record remains preserved in the database so existing orders continue displaying the exact product name. A base GPU series that still has AIB variants attached cannot be deleted; the system blocks the action and displays the message **"Please delete the AIB variants first"**.

## 5. Customer Support and Footer Information Pages

**Zalo Support Floating Button:** Displays a fixed floating Zalo chat icon at the bottom corner of the screen across all pages of the website. Clicking it redirects directly to the store's Zalo chat link (opening in a new browser tab or the corresponding Zalo application) to enable quick customer consultation without building a complex internal messaging system.

**GitHub Floating Button at Bottom Left of Footer:** Displays a GitHub icon positioned at the bottom left of the footer area. Clicking it opens the project's GitHub repository page in a new browser tab.

**Static Footer Information Pages:** The footer provides links to 3 minimalist static information pages to complete the experience of a computer hardware retail website: **Warranty and Return Policy**, **Payment and Shipping Guide**, and **Contact Information** (presenting concise, essential informational text without introducing complex workflows that would bloat the live demo scope). The Payment and Shipping Guide must match the shipping rules in Section 2.4 (free shipping for orders with 2 or more items, and 50,000 VND flat fee for single-item orders).

## 6. UI Presentation, Architecture, and Engineering Guidelines

**Prohibition of Repetitive List Symbols on the Web Interface:** All text content displayed across the customer-facing website (including product descriptions, usage guides, system notifications, outputs from the three specialized tools, and footer page content) must strictly avoid using em-dashes and bullet points, and instead use alternative presentation formats other than those two.

**Alternative Presentation Formats:** Interface information must be structured using alternatives other than em-dashes and bullet points, such as continuous prose sentences, structured comparison tables, specification labels, or visual information cards.

**Phased UI Skeleton and Decoupled Layout:** Initial development builds a minimal skeletal UI wireframe focused on verifying end-to-end user flows. Subsequent adjustments to button placement, styling, and visual layout must remain decoupled from core application logic.

**Backend-Centric Business Logic:** Core business calculations and rules—including cart price verification, shipping fee calculation, Order ID generation, order lookup rate-limiting, admin login rate-limiting, dynamic PassMark normalization, Performance-per-Price scoring and ranking, and PSU wattage estimation—must reside on the backend. The frontend acts strictly as a presentation layer that invokes backend APIs and renders returned data.

**Test Automation Readiness:** All primary interactive buttons, form fields, and navigation controls must include stable `data-testid` attributes to support reliable automated end-to-end testing.

## 7. Data Persistence Requirements

**Data That Must Be Stored Long Term:** Two primary groups of data must survive closing and reopening the website and remain consistent across any device:

1. **Product Catalog and Reference Hardware:** All storefront products, technical specifications, raw PassMark benchmark scores, power ratings, and Appendix A legacy reference entries, ensuring administrator updates persist across sessions and devices.

2. **Orders and Snapshots:** All placed orders and their historical item/pricing snapshots, enabling customers to look up orders using their Order ID and phone number from any device.

For these reasons, the project requires a persistent cloud-hosted relational database. Because the application is deployed on **Vercel** (serverless hosting with an ephemeral filesystem), local file-based databases such as SQLite or flat JSON files are unsuitable and would lose data across deployments or cold starts. Instead, the project uses **PostgreSQL hosted on Supabase** (free tier) for structured data and **Supabase Storage** for uploaded product images, ensuring administrator edits and customer orders persist reliably across sessions and devices.

**Data Kept in the Browser Only:** The guest shopping cart and active product comparison selection state are stored in the visitor's browser (`localStorage`) and require no server-side persistence.

**Technology Selection:** The specific technology stack and relational database schema are finalized in the next implementation phase following approval of this specification.

## Appendix A. Legacy Reference Components (Hidden from Storefront)

These components are used exclusively as selectable hardware options in the **PSU Wattage Estimator** (Section 3.3) and remain completely separate from the retail storefront catalog. Further legacy reference entries can be added or edited through Admin Mode at any time.

### A.1. Legacy CPU Reference List (24 models)

| ID | Model | Socket | Cores / Threads | 
| ----- | ----- | ----- | ----- | 
| C01 | Intel Core i9-11900K | LGA1200 | 8 / 16 | 
| C02 | Intel Core i7-11700K | LGA1200 | 8 / 16 | 
| C03 | Intel Core i5-11600K | LGA1200 | 6 / 12 | 
| C04 | Intel Core i5-11400F | LGA1200 | 6 / 12 | 
| C05 | Intel Core i9-10900K | LGA1200 | 10 / 20 | 
| C06 | Intel Core i7-10700K | LGA1200 | 8 / 16 | 
| C07 | Intel Core i5-10400F | LGA1200 | 6 / 12 | 
| C08 | Intel Core i3-10100F | LGA1200 | 4 / 8 | 
| C09 | Intel Core i7-9700K | LGA1151 | 8 / 8 | 
| C10 | Intel Core i5-9400F | LGA1151 | 6 / 6 | 
| C11 | Intel Core i7-8700K | LGA1151 | 6 / 12 | 
| C12 | Intel Core i5-8400 | LGA1151 | 6 / 6 | 
| C13 | AMD Ryzen 9 5950X | AM4 | 16 / 32 | 
| C14 | AMD Ryzen 9 5900X | AM4 | 12 / 24 | 
| C15 | AMD Ryzen 7 5800X3D | AM4 | 8 / 16 | 
| C16 | AMD Ryzen 7 5800X | AM4 | 8 / 16 | 
| C17 | AMD Ryzen 7 5700X | AM4 | 8 / 16 | 
| C18 | AMD Ryzen 5 5600X | AM4 | 6 / 12 | 
| C19 | AMD Ryzen 5 5600 | AM4 | 6 / 12 | 
| C20 | AMD Ryzen 5 5500 | AM4 | 6 / 12 | 
| C21 | AMD Ryzen 7 3700X | AM4 | 8 / 16 | 
| C22 | AMD Ryzen 5 3600 | AM4 | 6 / 12 | 
| C23 | AMD Ryzen 7 2700X | AM4 | 8 / 16 | 
| C24 | AMD Ryzen 5 2600 | AM4 | 6 / 12 | 

### A.2. Legacy GPU Reference List (33 base GPU series)

| ID | Model | VRAM | 
| ----- | ----- | ----- | 
| G01 | NVIDIA RTX 4090 | 24 GB | 
| G02 | NVIDIA RTX 4080 Super | 16 GB | 
| G03 | NVIDIA RTX 4070 Ti Super | 16 GB | 
| G04 | NVIDIA RTX 4070 Super | 12 GB | 
| G05 | NVIDIA RTX 4070 | 12 GB | 
| G06 | NVIDIA RTX 4060 Ti | 8 GB | 
| G07 | NVIDIA RTX 4060 | 8 GB | 
| G08 | NVIDIA RTX 3090 | 24 GB | 
| G09 | NVIDIA RTX 3080 | 10 GB | 
| G10 | NVIDIA RTX 3070 Ti | 8 GB | 
| G11 | NVIDIA RTX 3070 | 8 GB | 
| G12 | NVIDIA RTX 3060 Ti | 8 GB | 
| G13 | NVIDIA RTX 3060 | 12 GB | 
| G14 | NVIDIA RTX 3050 | 8 GB | 
| G15 | NVIDIA RTX 2080 Ti | 11 GB | 
| G16 | NVIDIA RTX 2070 Super | 8 GB | 
| G17 | NVIDIA RTX 2060 | 6 GB | 
| G18 | NVIDIA GTX 1080 Ti | 11 GB | 
| G19 | NVIDIA GTX 1660 Super | 6 GB | 
| G20 | NVIDIA GTX 1650 | 4 GB | 
| G21 | NVIDIA GTX 1060 | 6 GB | 
| G22 | AMD RX 7900 XTX | 24 GB | 
| G23 | AMD RX 7900 XT | 20 GB | 
| G24 | AMD RX 7800 XT | 16 GB | 
| G25 | AMD RX 7700 XT | 12 GB | 
| G26 | AMD RX 7600 | 8 GB | 
| G27 | AMD RX 6900 XT | 16 GB | 
| G28 | AMD RX 6800 XT | 16 GB | 
| G29 | AMD RX 6700 XT | 12 GB | 
| G30 | AMD RX 6600 XT | 8 GB | 
| G31 | AMD RX 6600 | 8 GB | 
| G32 | AMD RX 5700 XT | 8 GB | 
| G33 | AMD RX 580 | 8 GB | 