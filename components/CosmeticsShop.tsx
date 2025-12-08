import React, { useState } from 'react';
import { Cosmetic, CosmeticCategory, View } from '../types';
import { COSMETICS } from '../constants';

interface CosmeticsShopProps {
  cosmetics: Cosmetic[];
  onEquip: (cosmeticId: string) => void;
  onPurchase: (cosmeticId: string) => void;
  onBack: () => void;
  gold: number;
  gems: number; // Assuming gems are added to GameState
}

const CosmeticsShop: React.FC<CosmeticsShopProps> = ({
  cosmetics,
  onEquip,
  onPurchase,
  onBack,
  gold,
  gems
}) => {
  const [selectedCategory, setSelectedCategory] = useState<CosmeticCategory | 'ALL'>('ALL');

  const filteredCosmetics = selectedCategory === 'ALL'
    ? cosmetics
    : cosmetics.filter(c => c.category === selectedCategory);

  const getRarityColor = (rarity: string) => {
    switch (rarity) {
      case 'common': return 'text-gray-400';
      case 'rare': return 'text-blue-400';
      case 'epic': return 'text-purple-400';
      case 'legendary': return 'text-yellow-400';
      default: return 'text-white';
    }
  };

  const canAfford = (cosmetic: Cosmetic) => {
    if (!cosmetic.cost) return true;
    if (cosmetic.cost.gold && cosmetic.cost.gold > gold) return false;
    if (cosmetic.cost.gems && cosmetic.cost.gems > gems) return false;
    return true;
  };

  return (
    <div className="min-h-screen bg-black text-white p-4">
      <div className="max-w-4xl mx-auto">
        <div className="flex justify-between items-center mb-6">
          <h1 className="text-3xl font-bold">🎨 Cosmetics Shop</h1>
          <div className="flex gap-4">
            <div className="bg-yellow-600 px-3 py-1 rounded">💰 {gold}</div>
            <div className="bg-blue-600 px-3 py-1 rounded">💎 {gems}</div>
          </div>
        </div>

        {/* Category Filter */}
        <div className="flex gap-2 mb-6 flex-wrap">
          <button
            onClick={() => setSelectedCategory('ALL')}
            className={`px-4 py-2 rounded ${selectedCategory === 'ALL' ? 'bg-red-600' : 'bg-gray-700'}`}
          >
            All
          </button>
          {Object.values(CosmeticCategory).map(category => (
            <button
              key={category}
              onClick={() => setSelectedCategory(category)}
              className={`px-4 py-2 rounded ${selectedCategory === category ? 'bg-red-600' : 'bg-gray-700'}`}
            >
              {category.replace('_', ' ')}
            </button>
          ))}
        </div>

        {/* Cosmetics Grid */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
          {filteredCosmetics.map(cosmetic => (
            <div key={cosmetic.id} className="bg-gray-800 p-4 rounded-lg border border-gray-600">
              <div className="flex items-center justify-between mb-2">
                <div className="flex items-center gap-2">
                  <span className="text-2xl">{cosmetic.icon}</span>
                  <div>
                    <h3 className={`font-bold ${getRarityColor(cosmetic.rarity)}`}>
                      {cosmetic.name}
                    </h3>
                    <span className="text-xs uppercase text-gray-400">{cosmetic.rarity}</span>
                  </div>
                </div>
                {cosmetic.equipped && <span className="text-green-400">✓ Equipped</span>}
              </div>

              <p className="text-sm text-gray-300 mb-3">{cosmetic.description}</p>

              <div className="flex gap-2">
                {!cosmetic.owned ? (
                  cosmetic.unlockCondition ? (
                    <div className="text-xs text-yellow-400">Unlock via achievement</div>
                  ) : (
                    <button
                      onClick={() => onPurchase(cosmetic.id)}
                      disabled={!canAfford(cosmetic)}
                      className={`px-3 py-1 rounded text-sm ${
                        canAfford(cosmetic)
                          ? 'bg-green-600 hover:bg-green-700'
                          : 'bg-gray-600 cursor-not-allowed'
                      }`}
                    >
                      {cosmetic.cost?.gold ? `💰 ${cosmetic.cost.gold}` : ''}
                      {cosmetic.cost?.gems ? `💎 ${cosmetic.cost.gems}` : ''}
                    </button>
                  )
                ) : (
                  <button
                    onClick={() => onEquip(cosmetic.id)}
                    className={`px-3 py-1 rounded text-sm ${
                      cosmetic.equipped
                        ? 'bg-gray-600'
                        : 'bg-blue-600 hover:bg-blue-700'
                    }`}
                  >
                    {cosmetic.equipped ? 'Unequip' : 'Equip'}
                  </button>
                )}
              </div>
            </div>
          ))}
        </div>

        <div className="mt-6 text-center">
          <button
            onClick={onBack}
            className="px-6 py-3 bg-red-600 hover:bg-red-700 rounded-lg font-bold"
          >
            Back to Menu
          </button>
        </div>
      </div>
    </div>
  );
};

export default CosmeticsShop;