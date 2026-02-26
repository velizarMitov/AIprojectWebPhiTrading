// Internationalization (i18n) data for multi-language support
// Supports English (en) and Bulgarian (bg)

export const i18nData = {
    en: {
        // Sidebar navigation
        home: "Home",
        news: "News",
        forex: "Forex", 
        crypto: "Crypto",
        stocks: "Stocks",
        mlPredictions: "ML Predictions",
        adminPanel: "Admin Panel",
        
        // Authentication buttons
        login: "Login",
        register: "Register", 
        logout: "Logout",
        
        // Action buttons
        getPredictions: "Get Predictions",
        postNews: "Post News",
        addPrediction: "Add Prediction",
        
        // Hero section
        breaking: "BREAKING",
        loadingMarketIntelligence: "Loading Market Intelligence...",
        
        // Form labels
        email: "Email",
        password: "Password",
        fullName: "Full Name", 
        username: "Username",
        selectTier: "Select Tier",
        
        // Tier options
        bronze: "Bronze",
        silver: "Silver", 
        gold: "Gold",
        
        // General UI
        welcome: "Welcome",
        latestPredictions: "Latest Predictions",
        allNews: "ALL NEWS",
        
        // Categories
        filterBy: "Filter By:",
        
        // Additional common terms
        loading: "Loading...",
        save: "Save",
        cancel: "Cancel",
        edit: "Edit",
        delete: "Delete",
        confirm: "Confirm",
        
        // Messages
        loginSuccessful: "Login successful!",
        registrationSuccessful: "Registration Successful!",
        errorOccurred: "An error occurred",
        pleaseWait: "Please wait...",
        
        // News and predictions
        newsTitle: "News Title",
        newsContent: "News Content", 
        predictionText: "Prediction Text",
        category: "Category",
        asset: "Asset",
        requiredTier: "Required Tier"
    },
    
    bg: {
        // Sidebar navigation
        home: "Начало",
        news: "Новини",
        forex: "Форекс",
        crypto: "Криpto",
        stocks: "Акции",
        mlPredictions: "ML Прогнози",
        adminPanel: "Админ Панел",
        
        // Authentication buttons
        login: "Влизане",
        register: "Регистрация",
        logout: "Излизане",
        
        // Action buttons
        getPredictions: "Вземи Прогнози",
        postNews: "Публикувай Новини",
        addPrediction: "Добави Прогноза",
        
        // Hero section
        breaking: "СПЕШНО",
        loadingMarketIntelligence: "Зареждане на пазарна информация...",
        
        // Form labels
        email: "Имейл",
        password: "Парола",
        fullName: "Пълно име",
        username: "Потребителско име",
        selectTier: "Избери ниво",
        
        // Tier options
        bronze: "Бронз",
        silver: "Сребро",
        gold: "Злато",
        
        // General UI
        welcome: "Добре дошли",
        latestPredictions: "Последни прогнози",
        allNews: "ВСИЧКИ НОВИНИ",
        
        // Categories
        filterBy: "Филтрирай по:",
        
        // Additional common terms
        loading: "Зареждане...",
        save: "Запази",
        cancel: "Отмени", 
        edit: "Редактирай",
        delete: "Изтрий",
        confirm: "Потвърди",
        
        // Messages
        loginSuccessful: "Успешно влизане!",
        registrationSuccessful: "Успешна регистрация!",
        errorOccurred: "Възникна грешка",
        pleaseWait: "Моля, изчакайте...",
        
        // News and predictions
        newsTitle: "Заглавие на новината",
        newsContent: "Съдържание на новината",
        predictionText: "Текст на прогнозата", 
        category: "Категория",
        asset: "Актив",
        requiredTier: "Необходимо ниво"
    }
};

// Helper function to get translation by key and language
export function getTranslation(key, language = 'en') {
    return i18nData[language]?.[key] || i18nData['en'][key] || key;
}

// Helper function to get current language from localStorage or default to 'en'
export function getCurrentLanguage() {
    return localStorage.getItem('selectedLanguage') || 'en';
}

// Helper function to set language in localStorage
export function setLanguage(language) {
    if (i18nData[language]) {
        localStorage.setItem('selectedLanguage', language);
        return true;
    }
    return false;
}