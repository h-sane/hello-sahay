import { Doctor, Hospital } from '../types';

export const DEMO_HOSPITALS: Hospital[] = [
  // 1. Chengalpattu / Kanchipuram Hub (Tamil Nadu)
  {
    id: 'hosp-1',
    name: 'Chengalpattu Government Medical College Hospital',
    nativeNames: {
      ta: 'செங்கல்பட்டு அரசு மருத்துவக்கல்லூரி மருத்துவமனை',
      hi: 'चेंगलपट्टू सरकारी मेडिकल कॉलेज अस्पताल',
      en: 'Chengalpattu Government Medical College Hospital',
    },
    category: 'government',
    district: 'Chengalpattu',
    state: 'Tamil Nadu',
    pinCode: '603001',
    address: {
      ta: 'ஜிஎஸ்டி ரோடு, செங்கல்பட்டு, தமிழ்நாடு - 603001',
      hi: 'जीएसटी रोड, चेंगलपट्टू, तमिलनाडु - 603001',
      en: 'GST Road, Chengalpattu, Tamil Nadu - 603001',
    },
    distanceKm: 3.4,
    departments: [
      'General Medicine',
      'Pediatrics',
      'Cardiology',
      'Obstetrics & Gynecology',
      'Orthopedics',
      'General Surgery',
      'Ophthalmology',
      'ENT',
      'Dermatology',
    ],
    emergency24x7: true,
    schemesSupported: ['PM-JAY', 'CMCHIS'],
    contactPhone: '044-27426566',
    openingHours: '24 Hours Emergency | OPD: 08:00 AM - 01:00 PM',
    diagnosticServices: ['Digital X-Ray', 'ECG', 'Ultrasound Scan', 'CT Scan', 'Free Lab Blood & Urine Tests', '24x7 Blood Bank'],
    accessibilityInfo: 'Wheelchair Ramps, Stretcher Lift, Braille Signage, Accessible Toilets',
    verifiedDate: '2026-09-15',
    isDemo: true,
    latitude: 12.6841,
    longitude: 79.9836,
  },
  {
    id: 'hosp-2',
    name: 'Maduranthakam Upgraded Primary Health Centre (PHC)',
    nativeNames: {
      ta: 'மதுராந்தகம் மேம்படுத்தப்பட்ட ஆரம்ப சுகாதார நிலையம் (PHC)',
      hi: 'मदुरंतकम अपग्रेडेड प्राथमिक स्वास्थ्य केंद्र (PHC)',
      en: 'Maduranthakam Upgraded Primary Health Centre (PHC)',
    },
    category: 'phc',
    district: 'Chengalpattu',
    state: 'Tamil Nadu',
    pinCode: '603306',
    address: {
      ta: 'பஜார் தெரு, மதுராந்தகம், தமிழ்நாடு - 603306',
      hi: 'बाजार स्ट्रीट, मदुरंतकम, तमिलनाडु - 603306',
      en: 'Bazaar Street, Maduranthakam, Tamil Nadu - 603306',
    },
    distanceKm: 1.2,
    departments: ['General Medicine', 'Maternal & Child Health', 'Immunization', 'Dental', 'NCD Clinic (Diabetes/BP)'],
    emergency24x7: true,
    schemesSupported: ['CMCHIS', 'PM-JAY'],
    contactPhone: '044-27552230',
    openingHours: '24x7 Delivery & Emergency | OPD: 08:30 AM - 12:30 PM, 04:00 PM - 06:00 PM',
    diagnosticServices: ['Basic Blood Sugar & BP Testing', 'ECG', 'Hemoglobin Test', 'Free Generic Pharmacy'],
    accessibilityInfo: 'Ground Floor Direct Access, Wheelchair Entry',
    verifiedDate: '2026-09-20',
    isDemo: true,
    latitude: 12.5113,
    longitude: 79.8837,
  },
  {
    id: 'hosp-3',
    name: 'Tambaram Taluk Government Hospital',
    nativeNames: {
      ta: 'தாம்பரம் தாலுகா அரசு தலைமை மருத்துவமனை',
      hi: 'तांबरम तालुक सरकारी अस्पताल',
      en: 'Tambaram Taluk Government Hospital',
    },
    category: 'government',
    district: 'Chengalpattu',
    state: 'Tamil Nadu',
    pinCode: '600045',
    address: {
      ta: 'ரங்கநாதன் தெரு அருகில், மேற்கு தாம்பரம், சென்னை - 600045',
      hi: 'रंगनाथन स्ट्रीट के पास, पश्चिम तांबरम, चेन्नई - 600045',
      en: 'Near Ranganathan Street, West Tambaram, Chennai - 600045',
    },
    distanceKm: 8.7,
    departments: ['General Medicine', 'Orthopedics', 'ENT', 'Dermatology', 'Psychiatry', 'Dialysis Centre'],
    emergency24x7: true,
    schemesSupported: ['PM-JAY', 'CMCHIS'],
    contactPhone: '044-22265005',
    openingHours: '24 Hours Emergency | OPD: 08:00 AM - 02:00 PM',
    diagnosticServices: ['Digital X-Ray', 'Echo ECG', 'Free Hemodialysis Unit', 'Full Pathology Lab'],
    accessibilityInfo: 'Elevator, Wide Corridors, Helpdesk for Senior Citizens',
    verifiedDate: '2026-08-30',
    isDemo: true,
    latitude: 12.9249,
    longitude: 80.1165,
  },
  {
    id: 'hosp-4',
    name: 'Acharapakkam Community Health Centre (CHC)',
    nativeNames: {
      ta: 'அச்சரப்பாக்கம் சமூக நல சுகாதார மையம் (CHC)',
      hi: 'अचरपक्कम सामुदायिक स्वास्थ्य केंद्र (CHC)',
      en: 'Acharapakkam Community Health Centre (CHC)',
    },
    category: 'chc',
    district: 'Chengalpattu',
    state: 'Tamil Nadu',
    pinCode: '603301',
    address: {
      ta: 'மெயின் ரோடு, அச்சரப்பாக்கம், தமிழ்நாடு - 603301',
      hi: 'मेन रोड, अचरपक्कम, तमिलनाडु - 603301',
      en: 'Main Road, Acharapakkam, Tamil Nadu - 603301',
    },
    distanceKm: 12.1,
    departments: ['General Medicine', 'Pediatrics', 'Obstetrics', 'Tuberculosis & Leprosy Care'],
    emergency24x7: false,
    schemesSupported: ['CMCHIS'],
    contactPhone: '044-27566210',
    openingHours: 'OPD: 09:00 AM - 04:00 PM | Emergency on-call',
    diagnosticServices: ['Sputum Testing', 'Malaria/Dengue Rapid Test', 'Free Essential Drugs'],
    accessibilityInfo: 'Step-free entrance',
    verifiedDate: '2026-09-01',
    isDemo: true,
    latitude: 12.4285,
    longitude: 79.8242,
  },
  {
    id: 'hosp-kn-1',
    name: 'Kanchipuram District Headquarters Hospital',
    nativeNames: {
      ta: 'காஞ்சிபுரம் மாவட்ட தலைமை அரசு மருத்துவமனை',
      hi: 'कांचीपुरम जिला मुख्यालय सरकारी अस्पताल',
      en: 'Kanchipuram District Headquarters Hospital',
    },
    category: 'government',
    district: 'Kanchipuram',
    state: 'Tamil Nadu',
    pinCode: '631501',
    address: {
      ta: 'ரயில்வே ரோடு, காஞ்சிபுரம், தமிழ்நாடு - 631501',
      hi: 'रेलवे रोड, कांचीपुरम, तमिलनाडु - 631501',
      en: 'Railway Road, Kanchipuram, Tamil Nadu - 631501',
    },
    distanceKm: 4.2,
    departments: ['General Medicine', 'Orthopedics', 'Cardiology', 'Ophthalmology', 'Pediatrics', 'Gynecology'],
    emergency24x7: true,
    schemesSupported: ['PM-JAY', 'CMCHIS'],
    contactPhone: '044-27222450',
    openingHours: '24x7 Emergency | OPD: 08:00 AM - 01:30 PM',
    diagnosticServices: ['Digital X-Ray', 'CT Scan', 'Pathology Lab', 'Blood Bank'],
    accessibilityInfo: 'Ramps, Senior Citizen Priority OPD Counter',
    verifiedDate: '2026-09-18',
    isDemo: true,
    latitude: 12.8342,
    longitude: 79.7036,
  },

  // 2. Madurai Hub (Tamil Nadu)
  {
    id: 'hosp-mdu-1',
    name: 'Madurai Government Rajaji Medical College Hospital (GRH)',
    nativeNames: {
      ta: 'மதுரை அரசு ராஜாஜி மருத்துவக்கல்லூரி மருத்துவமனை',
      hi: 'मदुरै सरकारी राजाजी मेडिकल कॉलेज अस्पताल',
      en: 'Madurai Government Rajaji Medical College Hospital (GRH)',
    },
    category: 'government',
    district: 'Madurai',
    state: 'Tamil Nadu',
    pinCode: '625020',
    address: {
      ta: 'பனகல் ரோடு, கோரிப்பாளையம், மதுரை - 625020',
      hi: 'पनगल रोड, गोरीपलायम, मदुरै - 625020',
      en: 'Panagal Road, Goripalayam, Madurai - 625020',
    },
    distanceKm: 3.1,
    departments: ['General Medicine', 'Cardiology', 'Pediatrics', 'Orthopedics', 'Ophthalmology', 'Obstetrics & Gynecology', 'Emergency 24x7'],
    emergency24x7: true,
    schemesSupported: ['PM-JAY', 'CMCHIS'],
    contactPhone: '0452-2532535',
    openingHours: '24 Hours Emergency | OPD: 07:30 AM - 01:00 PM',
    diagnosticServices: ['MRI Scan', 'CT Scan', '24x7 Blood Bank', 'Free Lab Blood & Urine Tests'],
    accessibilityInfo: 'Ramps, Lifts, Wheelchairs at entrance',
    verifiedDate: '2026-09-10',
    isDemo: true,
    latitude: 9.9320,
    longitude: 78.1350,
  },
  {
    id: 'hosp-mdu-2',
    name: 'Usilampatti Taluk Government Hospital',
    nativeNames: {
      ta: 'உசிலம்பட்டி தாலுகா அரசு மருத்துவமனை',
      hi: 'उसीलमपट्टी तालुक सरकारी अस्पताल',
      en: 'Usilampatti Taluk Government Hospital',
    },
    category: 'government',
    district: 'Madurai',
    state: 'Tamil Nadu',
    pinCode: '625532',
    address: {
      ta: 'மெயின் ரோடு, உசிலம்பட்டி, மதுரை - 625532',
      hi: 'मेन रोड, उसीलमपट्टी, मदुरै - 625532',
      en: 'Main Road, Usilampatti, Madurai - 625532',
    },
    distanceKm: 2.8,
    departments: ['General Medicine', 'Maternal & Child Health', 'Pediatrics', 'Emergency on-call'],
    emergency24x7: true,
    schemesSupported: ['CMCHIS', 'PM-JAY'],
    contactPhone: '04543-252240',
    openingHours: '24x7 Emergency | OPD: 08:00 AM - 01:00 PM',
    diagnosticServices: ['Digital X-Ray', 'ECG', 'Free Primary Lab Tests'],
    accessibilityInfo: 'Ground floor direct ramp',
    verifiedDate: '2026-09-12',
    isDemo: true,
    latitude: 9.9708,
    longitude: 77.7944,
  },

  // 3. Salem & Coimbatore (Tamil Nadu)
  {
    id: 'hosp-slm-1',
    name: 'Salem Mohan Kumaramangalam Government Medical College Hospital',
    nativeNames: {
      ta: 'சேலம் மோகன் குமாரமங்கலம் அரசு மருத்துவக்கல்லூரி மருத்துவமனை',
      hi: 'सलेम मोहन कुमारमंगलम सरकारी मेडिकल कॉलेज अस्पताल',
      en: 'Salem Mohan Kumaramangalam Government Medical College Hospital',
    },
    category: 'government',
    district: 'Salem',
    state: 'Tamil Nadu',
    pinCode: '636001',
    address: {
      ta: 'கலெக்டரேட் அருகில், சேலம், தமிழ்நாடு - 636001',
      hi: 'कलेक्ट्रेट के पास, सलेम, तमिलनाडु - 636001',
      en: 'Near Collectorate, Salem, Tamil Nadu - 636001',
    },
    distanceKm: 2.9,
    departments: ['General Medicine', 'Cardiology', 'Pediatrics', 'Orthopedics', 'Ophthalmology', 'Trauma Care'],
    emergency24x7: true,
    schemesSupported: ['PM-JAY', 'CMCHIS'],
    contactPhone: '0427-2211200',
    openingHours: '24 Hours Emergency | OPD: 08:00 AM - 01:30 PM',
    diagnosticServices: ['CT Scan', 'Echo ECG', 'Full Pathology Lab', 'Blood Bank'],
    accessibilityInfo: 'Wheelchair access, tactile pathways',
    verifiedDate: '2026-09-08',
    isDemo: true,
    latitude: 11.6643,
    longitude: 78.1460,
  },

  // 4. Uttar Pradesh & North India (Gorakhpur, Varanasi, Lucknow)
  {
    id: 'hosp-5',
    name: 'Gorakhpur District Civil Hospital',
    nativeNames: {
      ta: 'கோரக்பூர் மாவட்ட சிவில் மருத்துவமனை',
      hi: 'गोरखपुर जिला संयुक्त चिकित्सालय',
      en: 'Gorakhpur District Civil Hospital',
    },
    category: 'government',
    district: 'Gorakhpur',
    state: 'Uttar Pradesh',
    pinCode: '273001',
    address: {
      ta: 'கோல்ஹர், கோரக்பூர், உத்திரபிரதேசம் - 273001',
      hi: 'गोलघर, गोरखपुर, उत्तर प्रदेश - 273001',
      en: 'Golghar, Gorakhpur, Uttar Pradesh - 273001',
    },
    distanceKm: 4.8,
    departments: ['General Medicine', 'Cardiology', 'Pediatrics', 'Gynecology', 'Orthopedics', 'Ayush Unit', 'Ophthalmology'],
    emergency24x7: true,
    schemesSupported: ['PM-JAY'],
    contactPhone: '0551-2334455',
    openingHours: '24 Hours Emergency | OPD: 08:00 AM - 02:00 PM',
    diagnosticServices: ['CT Scan', 'Digital X-Ray', 'Ultrasound', 'Jan Aushadhi Kendra inside campus'],
    accessibilityInfo: 'Ramps, Battery-operated patient vehicle inside premises',
    verifiedDate: '2026-09-18',
    isDemo: true,
    latitude: 26.7606,
    longitude: 83.3732,
  },
  {
    id: 'hosp-vns-1',
    name: 'Varanasi Pandit Deen Dayal Upadhyay Government Hospital',
    nativeNames: {
      ta: 'வாரணாசி பண்டிட் தீன் தயாள் அரசு மருத்துவமனை',
      hi: 'वाराणसी पंडित दीन दयाल उपाध्याय राजकीय चिकित्सालय',
      en: 'Varanasi Pandit Deen Dayal Upadhyay Government Hospital',
    },
    category: 'government',
    district: 'Varanasi',
    state: 'Uttar Pradesh',
    pinCode: '221002',
    address: {
      ta: 'பாண்டேபூர், வாரணாசி, உத்திரபிரதேசம் - 221002',
      hi: 'पांडेयपुर, वाराणसी, उत्तर प्रदेश - 221002',
      en: 'Pandeypur, Varanasi, Uttar Pradesh - 221002',
    },
    distanceKm: 3.5,
    departments: ['General Medicine', 'Cardiology', 'Pediatrics', 'Orthopedics', 'Maternal Care', 'Jan Aushadhi Kendra'],
    emergency24x7: true,
    schemesSupported: ['PM-JAY'],
    contactPhone: '0542-2585250',
    openingHours: '24 Hours Emergency | OPD: 08:00 AM - 02:00 PM',
    diagnosticServices: ['Digital X-Ray', 'Ultrasound', 'Free Blood Tests', 'Blood Bank'],
    accessibilityInfo: 'Ramps, Helpdesk with Hindi / Bhojpuri speaking staff',
    verifiedDate: '2026-09-22',
    isDemo: true,
    latitude: 25.3340,
    longitude: 82.9890,
  },
  {
    id: 'hosp-vns-2',
    name: 'Pindra Upgraded Community Health Centre (CHC)',
    nativeNames: {
      ta: 'பிந்த்ரா மேம்படுத்தப்பட்ட சமூக சுகாதார மையம் (CHC)',
      hi: 'पिंडरा अपग्रेडेड सामुदायिक स्वास्थ्य केंद्र (CHC)',
      en: 'Pindra Upgraded Community Health Centre (CHC)',
    },
    category: 'chc',
    district: 'Varanasi',
    state: 'Uttar Pradesh',
    pinCode: '221206',
    address: {
      ta: 'தேহசில் ரோடு, பிந்த்ரா, வாரணாசி - 221206',
      hi: 'तहसील रोड, पिंडरा, वाराणसी - 221206',
      en: 'Tehsil Road, Pindra, Varanasi - 221206',
    },
    distanceKm: 1.6,
    departments: ['General Medicine', 'Maternal & Child Health', 'Fever Clinic', 'Vaccination'],
    emergency24x7: true,
    schemesSupported: ['PM-JAY'],
    contactPhone: '0542-2622340',
    openingHours: '24x7 Maternity & Emergency | OPD: 08:30 AM - 01:30 PM',
    diagnosticServices: ['Malaria & Dengue Rapid Tests', 'Free Essential Drugs', 'ECG'],
    accessibilityInfo: 'Ground floor step-free access',
    verifiedDate: '2026-09-14',
    isDemo: true,
    latitude: 25.4800,
    longitude: 82.8500,
  },

  // 5. Maharashtra (Pune & Nashik)
  {
    id: 'hosp-mh-1',
    name: 'B.J. Government Medical College & Sassoon General Hospital Pune',
    nativeNames: {
      ta: 'சசூன் அரசு பொது மருத்துவமனை புனே',
      hi: 'ससून सर्वोपचार सरकारी रुग्णालय पुणे',
      en: 'B.J. Govt Medical College & Sassoon Hospital Pune',
    },
    category: 'government',
    district: 'Pune',
    state: 'Maharashtra',
    pinCode: '411001',
    address: {
      ta: 'ரயில்வே ஸ்டேஷன் அருகில், புனே - 411001',
      hi: 'रेलवे स्टेशन के पास, पुणे - 411001',
      en: 'Near Pune Railway Station, Pune - 411001',
    },
    distanceKm: 3.8,
    departments: ['General Medicine', 'Cardiology', 'Pediatrics', 'Orthopedics', 'Ophthalmology', 'Trauma Emergency'],
    emergency24x7: true,
    schemesSupported: ['PM-JAY'],
    contactPhone: '020-26128000',
    openingHours: '24x7 Emergency | OPD: 08:00 AM - 01:00 PM',
    diagnosticServices: ['MRI', 'CT Scan', 'Dialysis Centre', 'Blood Bank'],
    accessibilityInfo: 'Full accessibility, Marathi helpdesk',
    verifiedDate: '2026-09-15',
    isDemo: true,
    latitude: 18.5284,
    longitude: 73.8739,
  },
  {
    id: 'hosp-mh-2',
    name: 'Shirur Sub-District Government Hospital',
    nativeNames: {
      ta: 'ஷிரூர் துணை மாவட்ட அரசு மருத்துவமனை',
      hi: 'शिरूर उपजिल्हा शासकीय रुग्णालय',
      en: 'Shirur Sub-District Government Hospital',
    },
    category: 'government',
    district: 'Pune',
    state: 'Maharashtra',
    pinCode: '412210',
    address: {
      ta: 'நாகர் ரோடு, ஷிரூர், புனே - 412210',
      hi: 'नगर रोड, शिरूर, पुणे - 412210',
      en: 'Nagar Road, Shirur, Pune - 412210',
    },
    distanceKm: 2.1,
    departments: ['General Medicine', 'Pediatrics', 'Maternity Care', 'Emergency on-call'],
    emergency24x7: true,
    schemesSupported: ['PM-JAY'],
    contactPhone: '02138-222120',
    openingHours: '24x7 Emergency | OPD: 08:30 AM - 01:30 PM',
    diagnosticServices: ['Digital X-Ray', 'ECG', 'Pathology Lab'],
    accessibilityInfo: 'Ground floor entry, ramp',
    verifiedDate: '2026-09-11',
    isDemo: true,
    latitude: 18.8260,
    longitude: 74.3780,
  },

  // 6. Karnataka (Bengaluru Rural)
  {
    id: 'hosp-ka-1',
    name: 'Doddaballapura Taluk General Hospital (Bengaluru Rural)',
    nativeNames: {
      ta: 'தொட்டபள்ளாபுரா தாலுகா அரசு மருத்துவமனை',
      hi: 'दौड्डबल्लापुर तालुक सामान्य अस्पताल',
      en: 'Doddaballapura Taluk General Hospital',
    },
    category: 'government',
    district: 'Bengaluru Rural',
    state: 'Karnataka',
    pinCode: '561203',
    address: {
      ta: 'டி.பி ரோடு, தொட்டபள்ளாபுரா, கர்நாடகா - 561203',
      hi: 'डीबी रोड, दौड्डबल्लापुर, कर्नाटक - 561203',
      en: 'D.B. Road, Doddaballapura, Karnataka - 561203',
    },
    distanceKm: 3.2,
    departments: ['General Medicine', 'Pediatrics', 'Orthopedics', 'Maternity Care', 'Emergency 24x7'],
    emergency24x7: true,
    schemesSupported: ['PM-JAY'],
    contactPhone: '080-27622240',
    openingHours: '24x7 Emergency | OPD: 08:30 AM - 01:30 PM',
    diagnosticServices: ['Digital X-Ray', 'Ultrasound', 'Free Generic Pharmacy'],
    accessibilityInfo: 'Wheelchair access ramp',
    verifiedDate: '2026-09-09',
    isDemo: true,
    latitude: 13.2934,
    longitude: 77.5336,
  },

  // 7. Empaneled Private Partner
  {
    id: 'hosp-6',
    name: 'Apollo KH Rural Outreach Empaneled Hospital',
    nativeNames: {
      ta: 'அப்பல்லோ கேஹெச் கிராமப்புற மருத்துவமனை (அரசு காப்பீடு)',
      hi: 'अपोलो केएच ग्रामीण संबद्ध अस्पताल (आयुष्मान भारत)',
      en: 'Apollo KH Rural Outreach Empaneled Hospital',
    },
    category: 'private',
    district: 'Ranipet',
    state: 'Tamil Nadu',
    pinCode: '632513',
    address: {
      ta: 'ராணிப்பேட்டை - ஆற்காடு பைபாஸ், தமிழ்நாடு - 632513',
      hi: 'रानीपेट - आरकोट बाईपास, तमिलनाडु - 632513',
      en: 'Ranipet - Arcot Bypass, Tamil Nadu - 632513',
    },
    distanceKm: 18.5,
    departments: ['Cardiology', 'Nephrology', 'Critical Care', 'Neuro Surgery', 'Oncology Care'],
    emergency24x7: true,
    schemesSupported: ['PM-JAY', 'CMCHIS'],
    contactPhone: '04172-269500',
    openingHours: '24x7 Emergency & Inpatient | OPD: 09:00 AM - 05:00 PM',
    diagnosticServices: ['MRI 1.5T', 'Cath Lab', 'Advanced ICU', 'Dialysis Centre'],
    accessibilityInfo: 'Full Accessibility Compliance, Multilingual Assistance Desk',
    verifiedDate: '2026-09-10',
    isDemo: true,
    latitude: 12.9275,
    longitude: 79.3333,
  },
];

export const DEMO_DOCTORS: Doctor[] = [
  {
    id: 'doc-1',
    name: 'Dr. R. செந்தில் குமார் (Dr. R. Senthil Kumar)',
    specialty: 'General Medicine',
    hospitalId: 'hosp-1',
    qualification: 'MBBS, MD (General Medicine)',
    experienceYears: 16,
    availableDays: ['Monday', 'Wednesday', 'Friday'],
    opdTimings: '09:00 AM - 01:00 PM',
  },
  {
    id: 'doc-2',
    name: 'Dr. அனிதா பாலசுப்ரமணியன் (Dr. Anitha Balasubramanian)',
    specialty: 'Pediatrics',
    hospitalId: 'hosp-1',
    qualification: 'MBBS, DCH, MD (Pediatrics)',
    experienceYears: 12,
    availableDays: ['Monday', 'Tuesday', 'Thursday', 'Saturday'],
    opdTimings: '09:00 AM - 12:30 PM',
  },
  {
    id: 'doc-3',
    name: 'Dr. கே. ரமேஷ் பாபு (Dr. K. Ramesh Babu)',
    specialty: 'Cardiology',
    hospitalId: 'hosp-1',
    qualification: 'MBBS, MD, DM (Cardiology)',
    experienceYears: 19,
    availableDays: ['Tuesday', 'Thursday'],
    opdTimings: '10:00 AM - 02:00 PM',
  },
  {
    id: 'doc-4',
    name: 'Dr. கவிதா பிரியதர்ஷினி (Dr. Kavitha Priyadarshini)',
    specialty: 'General Medicine',
    hospitalId: 'hosp-2',
    qualification: 'MBBS (Medical Officer - PHC)',
    experienceYears: 8,
    availableDays: ['Monday', 'Tuesday', 'Wednesday', 'Thursday', 'Friday', 'Saturday'],
    opdTimings: '08:30 AM - 12:30 PM',
  },
  {
    id: 'doc-5',
    name: 'Dr. राजेश कुमार वर्मा (Dr. Rajesh Kumar Verma)',
    specialty: 'General Medicine',
    hospitalId: 'hosp-5',
    qualification: 'MBBS, MD (Medicine)',
    experienceYears: 14,
    availableDays: ['Monday', 'Tuesday', 'Wednesday', 'Friday'],
    opdTimings: '08:30 AM - 01:30 PM',
  },
  {
    id: 'doc-6',
    name: 'Dr. आनन्द मोहन झा (Dr. Anand Mohan Jha)',
    specialty: 'Pediatrics',
    hospitalId: 'hosp-vns-1',
    qualification: 'MBBS, DNB (Pediatrics)',
    experienceYears: 11,
    availableDays: ['Monday', 'Wednesday', 'Thursday', 'Saturday'],
    opdTimings: '09:00 AM - 01:00 PM',
  },
  {
    id: 'doc-7',
    name: 'Dr. राहुल कुलकर्णी (Dr. Rahul Kulkarni)',
    specialty: 'General Medicine',
    hospitalId: 'hosp-mh-1',
    qualification: 'MBBS, MD (Internal Medicine)',
    experienceYears: 15,
    availableDays: ['Monday', 'Tuesday', 'Thursday', 'Friday'],
    opdTimings: '08:30 AM - 01:00 PM',
  },
];

export const hospitalService = {
  getAll(): Hospital[] {
    return DEMO_HOSPITALS;
  },

  getById(id: string): Hospital | undefined {
    return DEMO_HOSPITALS.find((h) => h.id === id);
  },

  search(
    query: string,
    filters?: {
      category?: 'government' | 'phc' | 'private' | 'all';
      scheme?: 'PM-JAY' | 'CMCHIS' | 'all';
      emergencyOnly?: boolean;
    }
  ): Hospital[] {
    let result = [...DEMO_HOSPITALS];

    if (query && query.trim()) {
      const q = query.toLowerCase().trim();
      result = result.filter(
        (h) =>
          h.name.toLowerCase().includes(q) ||
          h.nativeNames.ta.toLowerCase().includes(q) ||
          h.nativeNames.hi.toLowerCase().includes(q) ||
          h.district.toLowerCase().includes(q) ||
          h.state.toLowerCase().includes(q) ||
          h.pinCode.includes(q) ||
          h.departments.some((d) => d.toLowerCase().includes(q))
      );
    }

    if (filters) {
      if (filters.category && filters.category !== 'all') {
        if (filters.category === 'government') {
          result = result.filter((h) => h.category === 'government' || h.category === 'phc' || h.category === 'chc');
        } else {
          result = result.filter((h) => h.category === filters.category);
        }
      }

      if (filters.scheme && filters.scheme !== 'all') {
        result = result.filter((h) => h.schemesSupported.includes(filters.scheme as 'PM-JAY' | 'CMCHIS'));
      }

      if (filters.emergencyOnly) {
        result = result.filter((h) => h.emergency24x7);
      }
    }

    // Default sort: Government & PHCs first, then by distance
    return result.sort((a, b) => {
      const aGov = a.category === 'government' || a.category === 'phc' || a.category === 'chc' ? 0 : 1;
      const bGov = b.category === 'government' || b.category === 'phc' || b.category === 'chc' ? 0 : 1;
      if (aGov !== bGov) return aGov - bGov;
      return a.distanceKm - b.distanceKm;
    });
  },

  getDoctorsForHospital(hospitalId: string, department?: string): Doctor[] {
    let doctors = DEMO_DOCTORS.filter((d) => d.hospitalId === hospitalId);
    if (department) {
      doctors = doctors.filter((d) => d.specialty.toLowerCase() === department.toLowerCase());
    }
    // If no specific doctor found for hospital, return general medicine doctor as fallback
    if (doctors.length === 0) {
      return [DEMO_DOCTORS[0]];
    }
    return doctors;
  },

  getAvailableSlots(): string[] {
    return [
      '09:00 AM',
      '09:30 AM',
      '10:00 AM',
      '10:30 AM',
      '11:00 AM',
      '11:30 AM',
      '12:00 PM',
      '12:30 PM',
    ];
  },
};
