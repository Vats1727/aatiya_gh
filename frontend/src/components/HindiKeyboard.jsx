import React, { useState } from 'react';

// Small, self-contained Hindi virtual keypad component.
// Props:
// - onInsert(char): called when a character (string) should be inserted
// - onBackspace(): called on backspace
// - onSpace(): called on space
// - onClear(): clear entire field
// - onClose(): close keyboard
// - visible: boolean

const rowsBase = [
  ['अ','आ','इ','ई','उ','ऊ','ऋ','ए','ऐ','ओ','औ'],
  ['क','ख','ग','घ','ङ','च','छ','ज','झ','ञ'],
  ['ट','ठ','ड','ढ','ण','त','थ','द','ध','न'],
  ['प','फ','ब','भ','म','य','र','ल','व','श'],
  ['ष','स','ह','क्ष','त्र','ज्ञ']
];

const rowsExtended = {
  matras: ['ा','ि','ी','ु','ू','ृ','े','ै','ो','ौ','ॅ','ॉ'],
  diacritics: ['्','ं','ः','ँ','़'], // halant, anusvara, visarga, chandrabindu, nukta
  numerals: ['०','१','२','३','४','५','६','७','८','९'],
  punctuation: ['।',',','?', '!', '—', '-', '"', "'", '(', ')']
};

const HindiKeyboard = ({ onInsert, onBackspace, onSpace, onClear, onClose, visible }) => {
  const [expanded, setExpanded] = useState(false);
  if (!visible) return null;
  const style = {
    position: 'fixed',
    left: '50%',
    transform: 'translateX(-50%)',
    bottom: '8px',
    zIndex: 99999,
    background: 'white',
    borderRadius: '10px',
    boxShadow: '0 6px 24px rgba(0,0,0,0.15)',
    padding: '10px',
    width: 'min(980px, calc(100% - 24px))',
  };
  const rowStyle = { display: 'flex', gap: 8, justifyContent: 'center', marginBottom: 8, flexWrap: 'wrap' };
  const keyStyle = { padding: '8px 10px', borderRadius: 6, border: '1px solid #e5e7eb', background: '#f9fafb', cursor: 'pointer', fontSize: 16, minWidth: 36, textAlign: 'center' };
  const controlStyle = { display: 'flex', gap: 8, justifyContent: 'center', marginTop: 6, flexWrap: 'wrap' };
  return (
    <div style={style} role="dialog" aria-label="Hindi virtual keyboard">
      <div style={{overflow: 'hidden'}}>
        {rowsBase.map((r, i) => (
          <div key={i} style={rowStyle}>
            {r.map(k => (
              <button key={k} type="button" onClick={() => onInsert(k)} style={keyStyle}>{k}</button>
            ))}
          </div>
        ))}

        <div style={{ display: 'flex', gap: 8, justifyContent: 'center', marginBottom: 8, flexWrap: 'wrap' }}>
          <button type="button" onClick={() => setExpanded(x => !x)} style={{ ...keyStyle, minWidth: 100 }}>{expanded ? 'Less' : 'More'}</button>
        </div>

        {expanded && (
          <>
            <div style={rowStyle}>
              {rowsExtended.matras.map(k => <button key={k} type="button" onClick={() => onInsert(k)} style={keyStyle}>{k}</button>)}
            </div>
            <div style={rowStyle}>
              {rowsExtended.diacritics.map(k => <button key={k} type="button" onClick={() => onInsert(k)} style={keyStyle}>{k}</button>)}
            </div>
            <div style={rowStyle}>
              {rowsExtended.numerals.map(k => <button key={k} type="button" onClick={() => onInsert(k)} style={keyStyle}>{k}</button>)}
            </div>
            <div style={rowStyle}>
              {rowsExtended.punctuation.map(k => <button key={k} type="button" onClick={() => onInsert(k)} style={keyStyle}>{k}</button>)}
            </div>
          </>
        )}

        <div style={controlStyle}>
          <button type="button" onClick={() => onInsert(' ')} style={{...keyStyle, minWidth: 140}}>Space</button>
          <button type="button" onClick={() => onBackspace()} style={keyStyle}>⌫</button>
          <button type="button" onClick={() => onClear()} style={keyStyle}>Clear</button>
          <button type="button" onClick={() => { setExpanded(false); onClose(); }} style={{...keyStyle, background: '#8b5cf6', color: 'white'}}>Close</button>
        </div>
      </div>
    </div>
  );
};

export default HindiKeyboard;
