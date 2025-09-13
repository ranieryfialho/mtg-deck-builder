import { useMemo } from 'react';
import { BarChart, Bar, XAxis, YAxis, Tooltip, ResponsiveContainer, Cell } from 'recharts';

const TYPE_COLORS = {
  'Creature': '#22c55e',
  'Land': '#a16207',
  'Sorcery': '#ef4444',
  'Instant': '#3b82f6',
  'Artifact': '#6b7280',
  'Enchantment': '#f1f5f9',
  'Planeswalker': '#a855f7',
  'Other': '#d1d5db'
};

const MAIN_TYPES = ['Creature', 'Land', 'Sorcery', 'Instant', 'Artifact', 'Enchantment', 'Planeswalker'];

const getPrimaryCardType = (typeLine = '') => {
  for (const type of MAIN_TYPES) {
    if (typeLine.includes(type)) {
      return type;
    }
  }
  return 'Other';
};

export function CardTypeChart({ deckCards, fullCardDetails }) {
  const chartData = useMemo(() => {
    if (!deckCards || !fullCardDetails || deckCards.length === 0 || fullCardDetails.length === 0) {
      return [];
    }

    const typeData = deckCards.reduce((acc, cardInDeck) => {
      const cardDetails = fullCardDetails.find(c => c.id === cardInDeck.card_id);
      if (!cardDetails || !cardDetails.type_line) {
        return acc;
      }

      const primaryType = getPrimaryCardType(cardDetails.type_line);
      
      if (!acc[primaryType]) {
        acc[primaryType] = 0;
      }
      acc[primaryType] += cardInDeck.quantity;
      
      return acc;
    }, {});

    return Object.keys(typeData).map(type => ({
      name: type,
      count: typeData[type],
    })).sort((a, b) => b.count - a.count);

  }, [deckCards, fullCardDetails]);

  if (chartData.length === 0) {
    return (
        <div style={{ width: '100%', height: 200, display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
            <p className="text-sm text-slate-400">Adicione cartas para ver as estatísticas.</p>
        </div>
    );
  }

  return (
    <div style={{ width: '100%', height: 200 }}>
      <ResponsiveContainer>
        <BarChart data={chartData} layout="vertical" margin={{ top: 5, right: 20, left: 10, bottom: 5 }}>
          <XAxis type="number" stroke="#94a3b8" fontSize={12} axisLine={false} tickLine={false} allowDecimals={false} domain={[0, dataMax => (Math.ceil(dataMax / 2) * 2)]} />
          <YAxis 
            type="category" 
            dataKey="name" 
            stroke="#94a3b8" 
            fontSize={12} 
            axisLine={false} 
            tickLine={false} 
            width={80} 
          />
          <Tooltip
            cursor={{ fill: 'rgba(100, 116, 139, 0.1)' }}
            contentStyle={{ backgroundColor: '#0f172a', border: '1px solid #334155', borderRadius: '0.5rem' }}
            labelStyle={{ color: '#f1f5f9' }}
            itemStyle={{ color: '#fbbf24' }}
          />
          <Bar dataKey="count" name="Quantidade" radius={[0, 4, 4, 0]}>
            {chartData.map((entry, index) => (
              <Cell key={`cell-${index}`} fill={TYPE_COLORS[entry.name] || TYPE_COLORS.Other} />
            ))}
          </Bar>
        </BarChart>
      </ResponsiveContainer>
    </div>
  );
}