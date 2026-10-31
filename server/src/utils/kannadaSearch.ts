/**
 * Bilingual Kannada-English Transliteration and Synonym Mapper
 * Allows non-technical shopkeepers to type Kannada grocery names
 * using the English alphabet (e.g. "sakkare" -> Sugar / ಸಕ್ಕರೆ).
 */

const KANNADA_SYNONYM_GROUPS: Array<{
  kannadaScript: string[];
  kannadaLatin: string[];
  english: string[];
}> = [
  {
    kannadaScript: ['ಸಕ್ಕರೆ'],
    kannadaLatin: ['sakkare', 'sakare', 'sakkari', 'cheeni', 'chini'],
    english: ['sugar'],
  },
  {
    kannadaScript: ['ಅಕ್ಕಿ', 'ಭತ್ತ'],
    kannadaLatin: ['akki', 'bhatta', 'tandula', 'chawal'],
    english: ['rice', 'sona', 'masoori', 'basmati', 'kolam', 'idli rice'],
  },
  {
    kannadaScript: ['ಹಾಲು'],
    kannadaLatin: ['haalu', 'halu', 'doodh'],
    english: ['milk', 'nandini'],
  },
  {
    kannadaScript: ['ತುಪ್ಪ'],
    kannadaLatin: ['tuppa', 'thuppa', 'tup'],
    english: ['ghee'],
  },
  {
    kannadaScript: ['ಉಪ್ಪು'],
    kannadaLatin: ['uppu', 'namak'],
    english: ['salt', 'tata salt'],
  },
  {
    kannadaScript: ['ಎಣ್ಣೆ'],
    kannadaLatin: ['enne', 'yenne', 'taila', 'tel'],
    english: ['oil', 'sunflower', 'groundnut oil', 'coconut oil'],
  },
  {
    kannadaScript: ['ಬೆಲ್ಲ'],
    kannadaLatin: ['bella', 'bellam', 'bellada', 'gur', 'guda'],
    english: ['jaggery'],
  },
  {
    kannadaScript: ['ತೊಗರಿ ಬೇಳೆ', 'ಬೇಳೆ'],
    kannadaLatin: ['togari', 'bele', 'toor', 'tuvar', 'dhal'],
    english: ['toor dal', 'dal', 'pulses'],
  },
  {
    kannadaScript: ['ಕಡಲೆ', 'ಕಡಲೆಕಾಯಿ'],
    kannadaLatin: ['kadale', 'kadalekayi', 'shenga', 'shengayi', 'moongphali'],
    english: ['groundnut', 'peanut', 'gram', 'chana'],
  },
  {
    kannadaScript: ['ಚಹಾ', 'ಟೀ'],
    kannadaLatin: ['chaha', 'cha', 'chai', 'chaha pudi'],
    english: ['tea', 'tea powder', 'red label'],
  },
  {
    kannadaScript: ['ಕಾಫಿ'],
    kannadaLatin: ['kafi', 'kaapi', 'coffee pudi'],
    english: ['coffee', 'bru', 'nescafe'],
  },
  {
    kannadaScript: ['ಗೋಧಿ', 'ಹಿಟ್ಟು'],
    kannadaLatin: ['godhi', 'hittu', 'gehu', 'atta'],
    english: ['wheat', 'flour', 'aashirvaad'],
  },
  {
    kannadaScript: ['ಅವಲಕ್ಕಿ'],
    kannadaLatin: ['avalakki', 'avlakki', 'poha'],
    english: ['beaten rice', 'poha', 'flattened rice'],
  },
  {
    kannadaScript: ['ರವೆ'],
    kannadaLatin: ['rave', 'ravva', 'sooji', 'suji'],
    english: ['semolina', 'bombay rava', 'chiroti rava'],
  },
  {
    kannadaScript: ['ಹೆಸರು ಬೇಳೆ'],
    kannadaLatin: ['hesaru', 'hesaru bele', 'moong', 'mung'],
    english: ['moong dal', 'green gram'],
  },
  {
    kannadaScript: ['ಉದ್ದಿನ ಬೇಳೆ', 'ಉದ್ದು'],
    kannadaLatin: ['uddu', 'uddina bele', 'urad'],
    english: ['urad dal', 'black gram'],
  },
  {
    kannadaScript: ['ಜೀರಿಗೆ'],
    kannadaLatin: ['jeerige', 'jeera', 'jira'],
    english: ['cumin', 'cumin seeds'],
  },
  {
    kannadaScript: ['ಸಾಸಿವೆ'],
    kannadaLatin: ['sasive', 'sasuve', 'rai', 'sarson'],
    english: ['mustard', 'mustard seeds'],
  },
  {
    kannadaScript: ['ಅರಿಶಿನ'],
    kannadaLatin: ['arishina', 'arashina', 'haldi'],
    english: ['turmeric', 'turmeric powder'],
  },
  {
    kannadaScript: ['ಮೆಣಸು', 'ಖಾರ'],
    kannadaLatin: ['menasu', 'menasina', 'khara', 'mirchi'],
    english: ['chilli', 'pepper', 'black pepper', 'chilli powder'],
  },
  {
    kannadaScript: ['ಈರುಳ್ಳಿ'],
    kannadaLatin: ['eerulli', 'irulli', 'ullagaddi', 'pyaz'],
    english: ['onion'],
  },
  {
    kannadaScript: ['ಬೆಳ್ಳುಳ್ಳಿ'],
    kannadaLatin: ['bellulli', 'lasun', 'lehsun'],
    english: ['garlic'],
  },
  {
    kannadaScript: ['ಶುಂಠಿ'],
    kannadaLatin: ['shunti', 'adrak'],
    english: ['ginger'],
  },
  {
    kannadaScript: ['ಕೊಬ್ಬರಿ', 'ತೆಂಗಿನಕಾಯಿ'],
    kannadaLatin: ['kobbari', 'tenginakayi', 'thengina', 'nariyal'],
    english: ['coconut', 'dry coconut'],
  },
  {
    kannadaScript: ['ಮೊಸರು'],
    kannadaLatin: ['mosaru', 'dahi'],
    english: ['curd', 'yogurt'],
  },
  {
    kannadaScript: ['ಬೆಣ್ಣೆ'],
    kannadaLatin: ['benne', 'makhan'],
    english: ['butter'],
  },
  {
    kannadaScript: ['ಸೋಪು'],
    kannadaLatin: ['sopu', 'soapu', 'sabu', 'sabun'],
    english: ['soap', 'bathing soap'],
  },
  {
    kannadaScript: ['ಬಿಸ್ಕತ್ತು'],
    kannadaLatin: ['biskath', 'biskit', 'biskooth'],
    english: ['biscuit', 'cookies', 'parle'],
  },
];

/**
 * Expands a search query into related bilingual tokens.
 * E.g., "sakkare" -> ["sakkare", "ಸಕ್ಕರೆ", "sugar", "cheeni"]
 */
export function expandSearchKeywords(input: string): string[] {
  const trimmed = input.trim().toLowerCase();
  if (!trimmed) return [];

  const resultSet = new Set<string>();
  resultSet.add(trimmed);

  // Split multi-word query into tokens
  const words = trimmed.split(/\s+/).filter(Boolean);

  for (const word of words) {
    resultSet.add(word);

    // Look for matches across synonym groups
    for (const group of KANNADA_SYNONYM_GROUPS) {
      const matchInLatin = group.kannadaLatin.some(
        (term) => term === word || term.includes(word) || word.includes(term)
      );
      const matchInScript = group.kannadaScript.some(
        (term) => term === word || term.includes(word) || word.includes(term)
      );
      const matchInEnglish = group.english.some(
        (term) => term === word || term.includes(word) || word.includes(term)
      );

      if (matchInLatin || matchInScript || matchInEnglish) {
        group.kannadaScript.forEach((t) => resultSet.add(t));
        group.kannadaLatin.forEach((t) => resultSet.add(t));
        group.english.forEach((t) => resultSet.add(t));
      }
    }
  }

  return Array.from(resultSet);
}
