import { ComposedChart, Bar, Line, XAxis, YAxis, Tooltip, ResponsiveContainer, Cell } from 'recharts';

const COLORS = ['#94a3b8', '#fbbf24', '#f59e0b', '#d97706', '#991b1b', '#7f1d1d', '#7f1d1d', '#7f1d1d'];

export function ManaCurveChart({ deckCards, fullCardDetails }) {
  if (!deckCards || !fullCardDetails || fullCardDetails.length === 0) {
    return <div style={{ width: '100%', height: 200 }} />;
  }

  const manaCurveData = fullCardDetails.reduce((acc, cardDetails) => {
    const cardInDeck = deckCards.find(c => c.card_id === cardDetails.id);
    const quantity = cardInDeck ? cardInDeck.quantity : 0;
    const cmc = Math.floor(cardDetails.cmc);
    if (cardDetails.type_line.toLowerCase().includes('land')) {
      return acc;
    }
    const existingEntry = acc.find(item => item.cmc === cmc);
    if (existingEntry) {
      existingEntry.count += quantity;
    } else {
      acc.push({ cmc: cmc, count: quantity });
    }
    return acc;
  }, []);

  const maxCmc = 7;
  for (let i = 0; i <= maxCmc; i++) {
    if (!manaCurveData.find(item => item.cmc === i)) {
      manaCurveData.push({ cmc: i, count: 0 });
    }
  }

  const highCmcCards = manaCurveData.filter(item => item.cmc > maxCmc);
  const highCmcCount = highCmcCards.reduce((sum, item) => sum + item.count, 0);

  let finalData = manaCurveData.filter(item => item.cmc <= maxCmc);
  const sevenPlusEntry = finalData.find(item => item.cmc === maxCmc);

  if (sevenPlusEntry) {
    sevenPlusEntry.count += highCmcCount;
    sevenPlusEntry.cmc = '7+';
  } else {
     finalData.push({ cmc: '7+', count: highCmcCount });
  }
  
  finalData = finalData.filter(item => !(typeof item.cmc === 'number' && item.cmc > maxCmc));

  finalData.sort((a, b) => {
    const valA = a.cmc === '7+' ? 7 : a.cmc;
    const valB = b.cmc === '7+' ? 7 : b.cmc;
    return valA - valB;
  });

  return (
    <div style={{ width: '100%', height: 200 }}>
      <ResponsiveContainer>
        <ComposedChart data={finalData} margin={{ top: 20, right: 20, left: -20, bottom: 5 }}>
          <XAxis dataKey="cmc" stroke="#94a3b8" fontSize={12} axisLine={false} tickLine={false} />
          <YAxis allowDecimals={false} stroke="#94a3b8" fontSize={12} axisLine={false} tickLine={false} />
          <Tooltip
            cursor={{ fill: 'rgba(100, 116, 139, 0.1)' }}
            contentStyle={{ backgroundColor: '#0f172a', border: '1px solid #334155', borderRadius: '0.5rem' }}
            labelStyle={{ color: '#f1f5f9' }}
            itemStyle={{ color: '#fbbf24' }}
          />
          <Bar dataKey="count" name="Quantidade" radius={[4, 4, 0, 0]}>
            {finalData.map((entry, index) => (
              <Cell key={`cell-${index}`} fill={COLORS[index % COLORS.length]} />
            ))}
          </Bar>
          <Line 
            type="monotone" 
            dataKey="count" 
            stroke="#8b5cf6"
            strokeWidth={2}
            dot={{ r: 4, fill: '#8b5cf6' }}
            activeDot={{ r: 6, stroke: '#c4b5fd' }}
            name="Curva"
          />
        </ComposedChart>
      </ResponsiveContainer>
    </div>
  );
}