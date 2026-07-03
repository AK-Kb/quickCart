const { initializeApp } = require('firebase/app');
const { getFirestore, collection, writeBatch, doc, query, where, getDocs } = require('firebase/firestore');

// Web App Firebase Configuration - Read from project config
const firebaseConfig = {
  apiKey: "AIzaSyBbIXhchMAEHaiZG8I29KucFLWdG5aVS4Y",
  authDomain: "quickcart-3cd3e.firebaseapp.com",
  projectId: "quickcart-3cd3e",
  storageBucket: "quickcart-3cd3e.firebasestorage.app",
  messagingSenderId: "735462211451",
  appId: "1:735462211451:web:2d6060d70a82c93046c7de",
  measurementId: "G-SLPS04P5PH"
};

// Initialize Firebase
const app = initializeApp(firebaseConfig);
const db = getFirestore(app);

// 29 Indian States/Regions
const STATES = [
  { id: 'andhra_pradesh', name: 'Andhra Pradesh' },
  { id: 'arunachal_pradesh', name: 'Arunachal Pradesh' },
  { id: 'assam', name: 'Assam' },
  { id: 'bihar', name: 'Bihar' },
  { id: 'chhattisgarh', name: 'Chhattisgarh' },
  { id: 'goa', name: 'Goa' },
  { id: 'gujarat', name: 'Gujarat' },
  { id: 'haryana', name: 'Haryana' },
  { id: 'himachal_pradesh', name: 'Himachal Pradesh' },
  { id: 'jharkhand', name: 'Jharkhand' },
  { id: 'karnataka', name: 'Karnataka' },
  { id: 'kerala', name: 'Kerala' },
  { id: 'madhya_pradesh', name: 'Madhya Pradesh' },
  { id: 'maharashtra', name: 'Maharashtra' },
  { id: 'manipur', name: 'Manipur' },
  { id: 'meghalaya', name: 'Meghalaya' },
  { id: 'mizoram', name: 'Mizoram' },
  { id: 'nagaland', name: 'Nagaland' },
  { id: 'odisha', name: 'Odisha' },
  { id: 'punjab', name: 'Punjab' },
  { id: 'rajasthan', name: 'Rajasthan' },
  { id: 'sikkim', name: 'Sikkim' },
  { id: 'tamil_nadu', name: 'Tamil Nadu' },
  { id: 'telangana', name: 'Telangana' },
  { id: 'tripura', name: 'Tripura' },
  { id: 'uttarakhand', name: 'Uttarakhand' },
  { id: 'uttar_pradesh', name: 'Uttar Pradesh' },
  { id: 'west_bengal', name: 'West Bengal' },
  { id: 'delhi', name: 'Delhi' }
];

// Localized city names
const CITIES = {
  andhra_pradesh: ['Visakhapatnam', 'Vijayawada', 'Guntur', 'Nellore', 'Kurnool', 'Tirupati', 'Rajahmundry', 'Kakinada', 'Kadapa', 'Anantapur'],
  arunachal_pradesh: ['Itanagar', 'Tawang', 'Pasighat', 'Ziro', 'Tezu', 'Bomdila', 'Aalo', 'Roing', 'Namsai', 'Khonsa'],
  assam: ['Guwahati', 'Dibrugarh', 'Silchar', 'Jorhat', 'Nagaon', 'Tinsukia', 'Tezpur', 'Bongaigaon', 'Karimganj', 'Sivasagar'],
  bihar: ['Patna', 'Gaya', 'Bhagalpur', 'Muzaffarpur', 'Purnia', 'Darbhanga', 'Bihar Sharif', 'Arrah', 'Begusarai', 'Katihar'],
  chhattisgarh: ['Raipur', 'Bilaspur', 'Durg', 'Bhilai', 'Korba', 'Rajnandgaon', 'Raigarh', 'Jagdalpur', 'Ambikapur', 'Dhamtari'],
  goa: ['Panaji', 'Margao', 'Vasco da Gama', 'Mapusa', 'Ponda', 'Bicholim', 'Curchorem', 'Cuncolim', 'Valpoi', 'Pernem'],
  gujarat: ['Ahmedabad', 'Surat', 'Vadodara', 'Rajkot', 'Bhavnagar', 'Jamnagar', 'Junagadh', 'Gandhinagar', 'Nadiad', 'Morbi'],
  haryana: ['Gurugram', 'Faridabad', 'Panipat', 'Ambala', 'Yamunanagar', 'Rohtak', 'Hisar', 'Karnal', 'Sonipat', 'Panchkula'],
  himachal_pradesh: ['Shimla', 'Dharamshala', 'Solan', 'Mandi', 'Kullu', 'Chamba', 'Una', 'Nahan', 'Hamirpur', 'Bilaspur'],
  jharkhand: ['Ranchi', 'Jamshedpur', 'Dhanbad', 'Bokaro', 'Deoghar', 'Hazaribagh', 'Giridih', 'Ramgarh', 'Phusro', 'Medininagar'],
  karnataka: ['Bengaluru', 'Mysuru', 'Hubballi', 'Mangaluru', 'Belagavi', 'Davanagere', 'Ballari', 'Tumakuru', 'Shivamogga', 'Kalaburagi'],
  kerala: ['Kochi', 'Thiruvananthapuram', 'Kozhikode', 'Thrissur', 'Kollam', 'Alappuzha', 'Palakkad', 'Kannur', 'Kottayam', 'Manjeri'],
  madhya_pradesh: ['Indore', 'Bhopal', 'Jabalpur', 'Gwalior', 'Ujjain', 'Sagar', 'Dewas', 'Satna', 'Ratlam', 'Rewa'],
  maharashtra: ['Mumbai', 'Pune', 'Nagpur', 'Nashik', 'Aurangabad', 'Solapur', 'Amravati', 'Kolhapur', 'Navi Mumbai', 'Thane'],
  manipur: ['Imphal', 'Thoubal', 'Kakching', 'Ukhrul', 'Senapati', 'Churachandpur', 'Chandel', 'Bishnupur', 'Jiribam', 'Noney'],
  meghalaya: ['Shillong', 'Tura', 'Jowai', 'Nongpoh', 'Williamnagar', 'Baghmara', 'Resubelpara', 'Mairang', 'Cherrapunji', 'Nongstoin'],
  mizoram: ['Aizawl', 'Lunglei', 'Champhai', 'Kolasib', 'Serchhip', 'Lawngtlai', 'Siaha', 'Mamit', 'Saitual', 'Khawzawl'],
  nagaland: ['Kohima', 'Dimapur', 'Mokokchung', 'Wokha', 'Tuensang', 'Zunheboto', 'Phek', 'Mon', 'Chumoukedima', 'Kiphire'],
  odisha: ['Bhubaneswar', 'Cuttack', 'Rourkela', 'Berhampur', 'Sambalpur', 'Puri', 'Balasore', 'Bhadrak', 'Baripada', 'Jharsuguda'],
  punjab: ['Ludhiana', 'Amritsar', 'Jalandhar', 'Patiala', 'Bathinda', 'Hoshiarpur', 'Mohali', 'Batala', 'Pathankot', 'Moga'],
  rajasthan: ['Jaipur', 'Jodhpur', 'Udaipur', 'Kota', 'Bikaner', 'Ajmer', 'Bhilwara', 'Alwar', 'Sikar', 'Srinagar'],
  sikkim: ['Gangtok', 'Namchi', 'Geyzing', 'Mangan', 'Singtam', 'Rangpo', 'Jorethang', 'Nayabazar', 'Ravangla', 'Pakyong'],
  tamil_nadu: ['Chennai', 'Coimbatore', 'Madurai', 'Trichy', 'Salem', 'Tirunelveli', 'Tiruppur', 'Vellore', 'Thoothukudi', 'Erode'],
  telangana: ['Hyderabad', 'Warangal', 'Nizamabad', 'Karimnagar', 'Ramagundam', 'Khammam', 'Mahbubnagar', 'Nalgonda', 'Adilabad', 'Suryapet'],
  tripura: ['Agartala', 'Dharmanagar', 'Udaipur', 'Kailasahar', 'Belonia', 'Khowai', 'Ambassa', 'Ranirbazar', 'Melaghar', 'Sabroom'],
  uttarakhand: ['Dehradun', 'Haridwar', 'Haldwani', 'Roorkee', 'Kashipur', 'Rishikesh', 'Rudrapur', 'Pithoragarh', 'Ramnagar', 'Manglaur'],
  uttar_pradesh: ['Lucknow', 'Kanpur', 'Ghaziabad', 'Agra', 'Varanasi', 'Meerut', 'Prayagraj', 'Bareilly', 'Aligarh', 'Noida'],
  west_bengal: ['Kolkata', 'Howrah', 'Darjeeling', 'Siliguri', 'Asansol', 'Durgapur', 'Kharagpur', 'Bardhaman', 'Malda', 'Baharampur'],
  delhi: ['New Delhi', 'Saket', 'Dwarka', 'Rohini', 'Connaught Place', 'Lajpat Nagar', 'Karol Bagh', 'Vasant Kunj', 'Shahdara', 'Pitampura']
};

// 10 categories
const CATEGORIES = [
  { id: 'electronics', name: 'Electronics' },
  { id: 'fashion', name: 'Fashion' },
  { id: 'home', name: 'Home' },
  { id: 'sports', name: 'Sports' },
  { id: 'beauty', name: 'Beauty' },
  { id: 'grocery', name: 'Grocery' },
  { id: 'books', name: 'Books' },
  { id: 'toys', name: 'Toys' },
  { id: 'auto', name: 'Automotive' },
  { id: 'health', name: 'Health' }
];

// Product Image assets
const CATEGORY_IMAGES = {
  electronics: [
    'https://images.unsplash.com/photo-1505740420928-5e560c06d30e?w=500&auto=format&fit=crop&q=60',
    'https://images.unsplash.com/photo-1572569511254-d8f925fe7cbb?w=500&auto=format&fit=crop&q=60',
    'https://images.unsplash.com/photo-1546435770-a3e426bf472b?w=500&auto=format&fit=crop&q=60',
    'https://images.unsplash.com/photo-1575311373937-040b8e1fd5b6?w=500&auto=format&fit=crop&q=60'
  ],
  fashion: [
    'https://images.unsplash.com/photo-1523275335684-37898b6baf30?w=500&auto=format&fit=crop&q=60',
    'https://images.unsplash.com/photo-1511499767150-a48a237f0083?w=500&auto=format&fit=crop&q=60',
    'https://images.unsplash.com/photo-1583847268964-b28dc8f51f92?w=500&auto=format&fit=crop&q=60',
    'https://images.unsplash.com/photo-1610030469983-98e550d6193c?w=500&auto=format&fit=crop&q=60'
  ],
  home: [
    'https://images.unsplash.com/photo-1505797149-43b0069ec26b?w=500&auto=format&fit=crop&q=60',
    'https://images.unsplash.com/photo-1553279768-865429fa0078?w=500&auto=format&fit=crop&q=60',
    'https://images.unsplash.com/photo-1514432324607-a09d9b4aefdd?w=500&auto=format&fit=crop&q=60',
    'https://images.unsplash.com/photo-1601050690597-df056fb4ce78?w=500&auto=format&fit=crop&q=60'
  ],
  sports: [
    'https://images.unsplash.com/photo-1575311373937-040b8e1fd5b6?w=500&auto=format&fit=crop&q=60',
    'https://images.unsplash.com/photo-1517838277536-f5f99be501cd?w=500&auto=format&fit=crop&q=60',
    'https://images.unsplash.com/photo-1541534741688-6078c6bfb5c5?w=500&auto=format&fit=crop&q=60',
    'https://images.unsplash.com/photo-1461896836934-ffe607ba8211?w=500&auto=format&fit=crop&q=60'
  ],
  beauty: [
    'https://images.unsplash.com/photo-1608248597279-f99d160bfcbc?w=500&auto=format&fit=crop&q=60',
    'https://images.unsplash.com/photo-1556228720-195a672e8a03?w=500&auto=format&fit=crop&q=60',
    'https://images.unsplash.com/photo-1522335789203-aabd1fc54bc9?w=500&auto=format&fit=crop&q=60',
    'https://images.unsplash.com/photo-1570172619644-dfd03ed5d881?w=500&auto=format&fit=crop&q=60'
  ],
  grocery: [
    'https://images.unsplash.com/photo-1542838132-92c53300491e?w=500&auto=format&fit=crop&q=60',
    'https://images.unsplash.com/photo-1597362925123-77861d3fbac7?w=500&auto=format&fit=crop&q=60',
    'https://images.unsplash.com/photo-1543083503-0377191761c2?w=500&auto=format&fit=crop&q=60',
    'https://images.unsplash.com/photo-1574492104443-471a7d6575a7?w=500&auto=format&fit=crop&q=60'
  ],
  books: [
    'https://images.unsplash.com/photo-1544716278-ca5e3f4abd8c?w=500&auto=format&fit=crop&q=60',
    'https://images.unsplash.com/photo-1497633762265-9d179a990aa6?w=500&auto=format&fit=crop&q=60',
    'https://images.unsplash.com/photo-1512820790803-83ca734da794?w=500&auto=format&fit=crop&q=60',
    'https://images.unsplash.com/photo-1506880018603-83d5b814b5a6?w=500&auto=format&fit=crop&q=60'
  ],
  toys: [
    'https://images.unsplash.com/photo-1537758061216-0499ee0279d0?w=500&auto=format&fit=crop&q=60',
    'https://images.unsplash.com/photo-1558060370-d644479cb6f7?w=500&auto=format&fit=crop&q=60',
    'https://images.unsplash.com/photo-1587654780291-39c9404d746b?w=500&auto=format&fit=crop&q=60',
    'https://images.unsplash.com/photo-1596461404969-9ae70f2830c1?w=500&auto=format&fit=crop&q=60'
  ],
  auto: [
    'https://images.unsplash.com/photo-1617886903355-9354ba5f85c6?w=500&auto=format&fit=crop&q=60',
    'https://images.unsplash.com/photo-1615906655593-ad79866b14d7?w=500&auto=format&fit=crop&q=60',
    'https://images.unsplash.com/photo-1486006920555-c77dce18193b?w=500&auto=format&fit=crop&q=60',
    'https://images.unsplash.com/photo-1563720223185-11003d516935?w=500&auto=format&fit=crop&q=60'
  ],
  health: [
    'https://images.unsplash.com/photo-1584017911766-d451b3d0e843?w=500&auto=format&fit=crop&q=60',
    'https://images.unsplash.com/photo-1512290923902-8a9f81dc236c?w=500&auto=format&fit=crop&q=60',
    'https://images.unsplash.com/photo-1579684389782-64d84b5e905d?w=500&auto=format&fit=crop&q=60',
    'https://images.unsplash.com/photo-1540206395-68808572332f?w=500&auto=format&fit=crop&q=60'
  ]
};

// Item templates to multiply
const TEMPLATES = {
  electronics: [
    { name: "SuperBass Wireless Headphones", price: 59.99 },
    { name: "SmartFit Fitness Band Pro", price: 39.99 },
    { name: "ChargeMax Power Bank 20K", price: 29.99 },
    { name: "UltraClean Sonic Electric Toothbrush", price: 49.99 },
    { name: "SoundWave Bluetooth Speaker", price: 34.99 },
    { name: "OptiView LED Desk Lamp", price: 19.99 },
    { name: "FastCharge Wireless Charging Pad", price: 15.99 },
    { name: "ClearCall TWS Earbuds", price: 27.99 },
    { name: "SpeedClick Wireless Gaming Mouse", price: 22.99 },
    { name: "AeroCool Laptop Cooling Pad", price: 18.99 }
  ],
  fashion: [
    { name: "Classic Cotton Polo T-Shirt", price: 18.50 },
    { name: "Vintage Aviator Sunglasses", price: 14.99 },
    { name: "ActiveWear Breathable Sports Shoes", price: 45.00 },
    { name: "SlimFit Stretch Denim Jeans", price: 32.99 },
    { name: "Elegant Leather Chronograph Watch", price: 89.99 },
    { name: "Handcrafted Leather Wallet", price: 12.99 },
    { name: "Cozy Cotton Knit Sweater", price: 28.50 },
    { name: "Casual Canvas Sneakers", price: 24.99 },
    { name: "Compact Travel Backpack", price: 19.99 },
    { name: "Warm Woolen Winter Scarf", price: 9.99 }
  ],
  home: [
    { name: "Ergonomic Memory Foam Pillow", price: 25.00 },
    { name: "Stainless Steel Water Bottle", price: 14.99 },
    { name: "Non-Stick Ceramic Frying Pan", price: 29.99 },
    { name: "Aroma Diffuser with Essential Oils", price: 18.99 },
    { name: "Premium Cotton Bed Sheet Set", price: 39.99 },
    { name: "Compact Espresso Coffee Maker", price: 79.99 },
    { name: "Smart WiFi LED Light Bulb", price: 11.99 },
    { name: "Handwoven Bamboo Laundry Basket", price: 16.50 },
    { name: "Digital Kitchen Weighing Scale", price: 9.99 },
    { name: "Automatic Liquid Soap Dispenser", price: 13.99 }
  ],
  sports: [
    { name: "Non-Slip Eco Yoga Mat", price: 19.99 },
    { name: "Heavy Duty Resistance Bands Set", price: 12.50 },
    { name: "UltraLite Camping Hammock", price: 24.99 },
    { name: "Waterproof Hiking Backpack 40L", price: 38.00 },
    { name: "High-Bounce Tennis Balls Pack", price: 7.99 },
    { name: "Adjustable Skipping Jump Rope", price: 5.99 },
    { name: "Insulated Sports Squeeze Bottle", price: 8.50 },
    { name: "Neoprene Dumbbells Set (2x2kg)", price: 17.99 },
    { name: "Anti-Glare Cycling Sunglasses", price: 13.99 },
    { name: "Professional Leather Soccer Ball", price: 21.99 }
  ],
  beauty: [
    { name: "Organic Aloe Vera Gel", price: 7.50 },
    { name: "Hydrating Hyaluronic Acid Serum", price: 15.99 },
    { name: "Natural Herbal Shampoo & Conditioner", price: 12.99 },
    { name: "Exfoliating Scrub Face Wash", price: 6.99 },
    { name: "Shea Butter Body Lotion", price: 9.50 },
    { name: "Matte Finish Liquid Lipstick", price: 11.00 },
    { name: "Organic Coconut Hair Oil", price: 8.00 },
    { name: "Soothing Lavender Bath Salts", price: 10.99 },
    { name: "Sunscreen SPF 50+ Broad Spectrum", price: 13.50 },
    { name: "Rose Water Facial Toner Spray", price: 5.99 }
  ],
  grocery: [
    { name: "Premium Darjeeling Tea Bags", price: 6.50 },
    { name: "Organic Raw Forest Honey", price: 9.99 },
    { name: "Handpicked Premium Cashews Pack", price: 14.50 },
    { name: "Spicy Garlic Chilli Oil", price: 5.50 },
    { name: "Gourmet Dark Chocolate Bar 70%", price: 4.50 },
    { name: "Organic Whole Wheat Pasta", price: 3.99 },
    { name: "Extra Virgin Olive Oil 500ml", price: 11.99 },
    { name: "Traditional Basmati Rice (1kg)", price: 4.99 },
    { name: "Roasted Salted Almonds Pack", price: 13.99 },
    { name: "Assorted Indian Spices Gift Box", price: 17.50 }
  ],
  books: [
    { name: "Hardcover Executive Dotted Journal", price: 8.99 },
    { name: "Fine Tip Gel Pens Multi-Color Set", price: 6.50 },
    { name: "Weekly Planner Organizer Notepad", price: 7.99 },
    { name: "Stainless Steel Premium Fountain Pen", price: 19.99 },
    { name: "Sticky Notes and Page Flags Set", price: 4.50 },
    { name: "Metal Desk Organizer Pen Stand", price: 5.99 },
    { name: "Sketchbook for Drawing (A4 Size)", price: 9.50 },
    { name: "Dual-Tip Art Markers 24 Colors", price: 15.99 },
    { name: "Erasable Whiteboard Markers Pack", price: 4.99 },
    { name: "Minimalist Wooden Bookends Set", price: 11.50 }
  ],
  toys: [
    { name: "Wooden Educational Building Blocks", price: 19.99 },
    { name: "3D Mechanical Wooden Puzzle Kit", price: 24.50 },
    { name: "Classic Board Game Strategy Set", price: 14.99 },
    { name: "DIY Science Experiment Kit for Kids", price: 18.00 },
    { name: "Remote Control Stunt Car Toy", price: 29.99 },
    { name: "Soft Plush Teddy Bear (Medium)", price: 12.99 },
    { name: "Watercolor Painting Kit for Beginners", price: 10.50 },
    { name: "Memory Match Card Game for Kids", price: 6.99 },
    { name: "Outdoor Bubble Blower Machine", price: 13.50 },
    { name: "Interactive Talking Alphabet Poster", price: 15.99 }
  ],
  auto: [
    { name: "Universal Car Mobile Phone Mount", price: 9.99 },
    { name: "Dual USB Car Charger Adapter", price: 7.50 },
    { name: "Premium Microfiber Car Cleaning Cloths", price: 8.99 },
    { name: "Portable Digital Car Tire Inflator", price: 29.99 },
    { name: "Car Dashboard Gel Air Freshener", price: 4.50 },
    { name: "Anti-Fog Side Mirror Protective Film", price: 3.99 },
    { name: "Ergonomic Car Seat Lumbar Support Pillow", price: 18.50 },
    { name: "Compact Car Trash Can with Lid", price: 6.99 },
    { name: "Heavy Duty Jumper Cables 10ft", price: 15.99 },
    { name: "Waterproof Cargo Trunk Organizer", price: 19.99 }
  ],
  health: [
    { name: "Premium Whey Protein Powder (1kg)", price: 39.99 },
    { name: "Daily Multivitamin Capsules (90 pcs)", price: 14.99 },
    { name: "Cold Pressed Omega-3 Fish Oil", price: 12.50 },
    { name: "Digital Body Weight Scale", price: 18.99 },
    { name: "Acupressure Foot Massage Roller", price: 7.99 },
    { name: "Natural Herbal Green Tea Leaves", price: 5.50 },
    { name: "Fast Relief Muscle Massage Gun", price: 49.99 },
    { name: "Orthopedic Knee Support Sleeve", price: 9.99 },
    { name: "Air Purifying Himalayan Salt Lamp", price: 22.50 },
    { name: "Essential Vitamin D3 Softgels", price: 8.99 }
  ]
};

async function executeSeed() {
  console.log('Generating 2,900+ customized e-commerce products...');
  const items = [];

  for (const state of STATES) {
    const stateCities = CITIES[state.id];
    for (const cat of CATEGORIES) {
      const templates = TEMPLATES[cat.id];
      for (let i = 0; i < templates.length; i++) {
        const template = templates[i];
        
        const city = stateCities[i % stateCities.length];
        
        // Predictable unique ID to naturally overwrite and avoid duplicates on multiple runs
        const itemId = `item_${state.id}_${cat.id}_${i}`;
        const title = `${city} ${template.name}`;
        const desc = `Premium ${template.name} sourced directly from the local markets of ${city}, ${state.name}. Guaranteed high-quality materials and craftsmanship. Perfect for your everyday needs.`;
        const tags = [
          cat.name.toLowerCase(), 
          state.name.toLowerCase(), 
          city.toLowerCase(), 
          "featured", 
          "premium", 
          "india"
        ];
        
        // Unsplash images catalog mapping
        const imagesList = CATEGORY_IMAGES[cat.id];
        const image = imagesList[i % imagesList.length];

        const rating = parseFloat((4.0 + Math.random() * 0.9).toFixed(1));
        const availability = Math.random() > 0.05 ? "In Stock" : "Out of Stock";

        items.push({
          id: itemId,
          name: title,
          title: title,
          price: template.price,
          category: cat.name,
          categoryName: cat.name,
          categoryId: cat.id,
          rating,
          image,
          color: "#0B6A9C",
          state: state.name,
          stateName: state.name,
          stateId: state.id,
          description: desc,
          city,
          tags,
          availability,
          status: availability
        });
      }
    }
  }

  console.log(`Writing ${items.length} items to Firestore...`);

  // Write in batches of 400 documents
  const batchSize = 400;
  for (let index = 0; index < items.length; index += batchSize) {
    const batch = writeBatch(db);
    const chunk = items.slice(index, index + batchSize);
    
    chunk.forEach(item => {
      const docRef = doc(db, 'products', item.id);
      batch.set(docRef, item);
    });

    await batch.commit();
    console.log(` - Batch saved: items ${index} to ${index + chunk.length - 1}`);
  }

  console.log('\nSeeding completed successfully!');
  
  // Verify that Delhi state has all categories and items correctly populated
  await runVerification();
}

async function runVerification() {
  console.log('\n--- Seeding Verification (Sample State: Delhi) ---');
  const productsCol = collection(db, 'products');
  const q = query(productsCol, where('stateId', '==', 'delhi'));
  const snapshot = await getDocs(q);
  
  console.log(`Total items found for Delhi: ${snapshot.size} (Expected: 100)`);
  
  const categoryCounts = {};
  snapshot.forEach(doc => {
    const data = doc.data();
    categoryCounts[data.categoryName] = (categoryCounts[data.categoryName] || 0) + 1;
  });
  
  console.log('Category Counts:');
  Object.entries(categoryCounts).forEach(([catName, count]) => {
    console.log(` - ${catName}: ${count} items (Expected: 10)`);
  });
  
  if (snapshot.size === 100 && Object.keys(categoryCounts).length === 10) {
    console.log('\n✅ Verification SUCCESS: Delhi has exactly 10 categories with 10 items each.');
  } else {
    console.log('\n❌ Verification FAILURE: Delhi counts did not match expected values.');
    process.exit(1);
  }
}

executeSeed().catch(err => {
  console.error('Seeding process failed:', err);
  process.exit(1);
});
