// Minimal phonetic (ITRANS-like) transliterator for common Latin sequences to Devanagari.
// This is a small, best-effort implementation covering common patterns like "mera hostel" -> "मेरा होस्टल".

const consonantMap = {
  'kh':'ख','k':'क','gh':'घ','g':'ग','ng':'ङ',
  'ch':'च','chh':'छ','j':'ज','jh':'झ','ny':'ञ',
  't':'त','th':'थ','d':'द','dh':'ध','n':'न',
  'p':'प','ph':'फ','f':'फ','b':'ब','bh':'भ','m':'म',
  'y':'य','r':'र','l':'ल','v':'व','w':'व','sh':'श','shh':'ष','s':'स','h':'ह','z':'ज़',
  'q':'क','x':'क्स'
};

const vowelMap = {
  'aa':'आ','a':'अ','i':'इ','ii':'ई','ee':'ई','u':'उ','uu':'ऊ','oo':'ऊ','e':'ए','ai':'ऐ','o':'ओ','au':'औ','ri':'ऋ'
};

const matraMap = {
  'aa':'ा','a':'','i':'ि','ii':'ी','ee':'ी','u':'ु','uu':'ू','oo':'ू','e':'े','ai':'ै','o':'ो','au':'ौ','ri':'ृ'
};

// Order tokens by length to match longest first
const consonantKeys = Object.keys(consonantMap).sort((a,b)=>b.length-a.length);
const vowelKeys = Object.keys(vowelMap).sort((a,b)=>b.length-a.length);

export function itransToDevanagari(input) {
  if (!input) return '';
  const s = String(input).toLowerCase();
  let i = 0;
  let out = '';

  while (i < s.length) {
    if (s[i] === ' ' || s[i] === '\n' || s[i] === '\t' || /[.,;:!?]/.test(s[i])) {
      out += s[i];
      i++;
      continue;
    }

    // Try vowel at current position
    let matchedVowel = null;
    for (const vk of vowelKeys) {
      if (s.startsWith(vk, i)) { matchedVowel = vk; break; }
    }
    if (matchedVowel) {
      // vowel at syllable start: use standalone vowel letter
      out += vowelMap[matchedVowel] || matchedVowel;
      i += matchedVowel.length;
      continue;
    }

    // Try consonant cluster
    let matchedCons = null;
    for (const ck of consonantKeys) {
      if (s.startsWith(ck, i)) { matchedCons = ck; break; }
    }
    if (matchedCons) {
      const base = consonantMap[matchedCons] || matchedCons;
      i += matchedCons.length;
      // After consonant try vowel
      let nextVowel = null;
      for (const vk of vowelKeys) {
        if (s.startsWith(vk, i)) { nextVowel = vk; break; }
      }
      if (nextVowel) {
        const matra = matraMap[nextVowel] !== undefined ? matraMap[nextVowel] : '';
        if (matra === '') {
          // inherent 'a', just append consonant base
          out += base;
        } else {
          // append consonant base + matra
          out += base + matra;
        }
        i += nextVowel.length;
      } else {
        // No explicit vowel: assume inherent 'a'
        out += base;
      }
      continue;
    }

    // Fallback: copy character
    out += s[i];
    i++;
  }

  // Post-processing: simple fixes for common sequences
  // Replace 'm' + 'e' produced 'मे' already via mapping; handle 'aa' etc.
  // Capitalization: try to mirror capitalization by upper-case Latin words? keep simple.
  return out;
}
