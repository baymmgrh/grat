/**
 * Test script for i18n functionality
 * This script helps test language switching and translation coverage
 */

import { translations } from '../contexts/LanguageContext';

// Test translation coverage
export const testTranslationCoverage = () => {
  const idKeys = Object.keys(translations.id);
  const enKeys = Object.keys(translations.en);
  
  console.log('🧪 Testing Translation Coverage...');
  console.log(`Indonesian keys: ${idKeys.length}`);
  console.log(`English keys: ${enKeys.length}`);
  
  // Find missing keys in English
  const missingInEnglish = idKeys.filter(key => !enKeys.includes(key));
  if (missingInEnglish.length > 0) {
    console.warn('⚠️ Missing English translations:', missingInEnglish);
  }
  
  // Find missing keys in Indonesian
  const missingInIndonesian = enKeys.filter(key => !idKeys.includes(key));
  if (missingInIndonesian.length > 0) {
    console.warn('⚠️ Missing Indonesian translations:', missingInIndonesian);
  }
  
  if (missingInEnglish.length === 0 && missingInIndonesian.length === 0) {
    console.log('✅ All translations are complete!');
  }
  
  return {
    idKeys: idKeys.length,
    enKeys: enKeys.length,
    missingInEnglish,
    missingInIndonesian,
    isComplete: missingInEnglish.length === 0 && missingInIndonesian.length === 0
  };
};

// Test specific module translations
export const testModuleTranslations = (module: string) => {
  const idModuleKeys = Object.keys(translations.id).filter(key => key.startsWith(`${module}.`));
  const enModuleKeys = Object.keys(translations.en).filter(key => key.startsWith(`${module}.`));
  
  console.log(`🧪 Testing ${module} module translations...`);
  console.log(`Indonesian ${module} keys: ${idModuleKeys.length}`);
  console.log(`English ${module} keys: ${enModuleKeys.length}`);
  
  const missingInEnglish = idModuleKeys.filter(key => !enModuleKeys.includes(key));
  const missingInIndonesian = enModuleKeys.filter(key => !idModuleKeys.includes(key));
  
  if (missingInEnglish.length > 0) {
    console.warn(`⚠️ Missing English ${module} translations:`, missingInEnglish);
  }
  
  if (missingInIndonesian.length > 0) {
    console.warn(`⚠️ Missing Indonesian ${module} translations:`, missingInIndonesian);
  }
  
  if (missingInEnglish.length === 0 && missingInIndonesian.length === 0) {
    console.log(`✅ ${module} module translations are complete!`);
  }
  
  return {
    module,
    idKeys: idModuleKeys.length,
    enKeys: enModuleKeys.length,
    missingInEnglish,
    missingInIndonesian,
    isComplete: missingInEnglish.length === 0 && missingInIndonesian.length === 0
  };
};

// Test all modules
export const testAllModules = () => {
  const modules = [
    'nav', 'common', 'dashboard', 'products', 'warehouse', 'production',
    'sales', 'purchasing', 'finance', 'quality', 'hr', 'maintenance',
    'rd', 'oee', 'waste', 'mrp', 'analytics', 'shipping', 'admin',
    'ui', 'date', 'validation', 'success', 'error', 'confirm', 'auth'
  ];
  
  console.log('🧪 Testing all module translations...');
  
  const results = modules.map(module => testModuleTranslations(module));
  
  const incompleteModules = results.filter(result => !result.isComplete);
  
  if (incompleteModules.length === 0) {
    console.log('🎉 All modules have complete translations!');
  } else {
    console.warn(`⚠️ ${incompleteModules.length} modules have incomplete translations:`, 
      incompleteModules.map(m => m.module));
  }
  
  return results;
};

// Generate missing translation template
export const generateMissingTranslations = (language: 'id' | 'en') => {
  const sourceKeys = Object.keys(translations[language === 'id' ? 'en' : 'id']);
  const targetKeys = Object.keys(translations[language]);
  
  const missingKeys = sourceKeys.filter(key => !targetKeys.includes(key));
  
  if (missingKeys.length === 0) {
    console.log(`✅ No missing translations for ${language}`);
    return '';
  }
  
  console.log(`📝 Generating missing ${language} translations...`);
  
  const template = missingKeys.map(key => {
    const sourceValue = translations[language === 'id' ? 'en' : 'id'][key as keyof typeof translations['en']];
    return `    '${key}': '${sourceValue}', // TODO: Translate to ${language === 'id' ? 'Indonesian' : 'English'}`;
  }).join('\n');
  
  return template;
};

// Test function for browser console
export const runI18nTests = () => {
  console.log('🚀 Running i18n tests...\n');
  
  // Test overall coverage
  const coverage = testTranslationCoverage();
  console.log('\n');
  
  // Test all modules
  const moduleResults = testAllModules();
  console.log('\n');
  
  // Generate missing translations if any
  if (!coverage.isComplete) {
    console.log('📝 Missing translation templates:\n');
    
    if (coverage.missingInEnglish.length > 0) {
      console.log('English missing translations:');
      console.log(generateMissingTranslations('en'));
      console.log('\n');
    }
    
    if (coverage.missingInIndonesian.length > 0) {
      console.log('Indonesian missing translations:');
      console.log(generateMissingTranslations('id'));
    }
  }
  
  return {
    coverage,
    moduleResults,
    summary: {
      totalModules: moduleResults.length,
      completeModules: moduleResults.filter(r => r.isComplete).length,
      incompleteModules: moduleResults.filter(r => !r.isComplete).length
    }
  };
};

// Export for use in components
export default {
  testTranslationCoverage,
  testModuleTranslations,
  testAllModules,
  generateMissingTranslations,
  runI18nTests
};
