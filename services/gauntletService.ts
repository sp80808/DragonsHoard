
import { GauntletNode, GauntletState, HeroClass, Artifact } from '../types';
import { createId, rng } from './gameLogic';
import { ARTIFACTS } from '../constants';

const MAP_DEPTH = 12;
const PATHS_PER_LAYER = 3;

export const generateGauntletMap = (): GauntletNode[] => {
    const map: GauntletNode[] = [];
    const layerNodes: string[][] = []; // Keep track of IDs per layer to link them

    // 1. Generate Layers
    for (let layer = 0; layer < MAP_DEPTH; layer++) {
        const currentLayerIds: string[] = [];
        const isBossLayer = layer === MAP_DEPTH - 1;
        const isStartLayer = layer === 0;
        
        // Determine number of nodes in this layer (1 for start/boss, 2-3 for others)
        const nodeCount = isStartLayer || isBossLayer ? 1 : rng.nextInt(2, 3);

        for (let i = 0; i < nodeCount; i++) {
            const id = createId();
            currentLayerIds.push(id);
            
            let type: GauntletNode['type'] = 'COMBAT';
            
            if (isStartLayer) type = 'START';
            else if (isBossLayer) type = 'BOSS';
            else {
                // Randomize node type
                const roll = rng.next();
                if (roll < 0.5) type = 'COMBAT';
                else if (roll < 0.65) type = 'ELITE';
                else if (roll < 0.8) type = 'SHOP';
                else if (roll < 0.9) type = 'REST';
                else type = 'TREASURE';
            }

            map.push({
                id,
                type,
                tier: layer,
                x: i, // Index in layer (for rendering position)
                y: layer,
                parents: [],
                status: isStartLayer ? 'AVAILABLE' : 'LOCKED',
                data: {}
            });
        }
        layerNodes.push(currentLayerIds);
    }

    // 2. Link Nodes (Parents)
    // A node at layer L should have parents at L-1.
    for (let layer = 1; layer < MAP_DEPTH; layer++) {
        const currentIds = layerNodes[layer];
        const prevIds = layerNodes[layer - 1];

        currentIds.forEach((currId, idx) => {
            const node = map.find(n => n.id === currId);
            if (!node) return;

            // Simple logic: connect to 'nearby' nodes in previous layer
            // For 1->N or N->1 connections (boss/start), connect all.
            if (currentIds.length === 1) {
                // Boss connects to all prev
                node.parents = prevIds; 
            } else if (prevIds.length === 1) {
                // All current connect to Start
                node.parents = prevIds;
            } else {
                // 2->2, 2->3, 3->2 logic. Connect to index and index+1 roughly
                // Ensure at least one parent
                const p1 = prevIds[idx % prevIds.length];
                const p2 = prevIds[(idx + 1) % prevIds.length];
                node.parents = [...new Set([p1, p2])]; // De-dupe
            }
        });
    }

    return map;
};

export const initGauntletState = (heroClass: HeroClass): GauntletState => {
    return {
        map: generateGauntletMap(),
        currentTier: 0,
        health: 100, // Percentage based or fixed
        maxHealth: 100,
        artifacts: [],
        deck: []
    };
};

export const unlockNextLayer = (state: GauntletState, completedNodeId: string): GauntletState => {
    const newMap = state.map.map(node => {
        if (node.id === completedNodeId) {
            return { ...node, status: 'COMPLETED' as const };
        }
        // Unlock children
        if (node.parents.includes(completedNodeId)) {
            return { ...node, status: 'AVAILABLE' as const };
        }
        // Lock siblings in the same tier that weren't picked (strict pathing)
        // Actually, typically in Slay the Spire, siblings become inaccessible once you pick a node in that tier.
        // We can check if any node in this tier was COMPLETED.
        return node;
    });

    // Post-process: Lock unpicked nodes in the completed tier
    const completedNode = state.map.find(n => n.id === completedNodeId);
    if (completedNode) {
        newMap.forEach(n => {
            if (n.tier === completedNode.tier && n.id !== completedNodeId) {
                n.status = 'SKIPPED';
            }
        });
    }

    return {
        ...state,
        map: newMap,
        currentTier: state.currentTier + 1
    };
};

export const getRandomArtifact = (): Artifact => {
    return ARTIFACTS[Math.floor(rng.next() * ARTIFACTS.length)];
};
