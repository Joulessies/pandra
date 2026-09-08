import { CustomWidget } from '@/types/widget';
import { pandraColors } from '@/theme/token';
import {
    geocodeCity,
    fetchLiveWeatherData,
    fetchLiveNewsData,
    fetchLiveBatteryData,
} from '@/services/personal-widget-fetcher';
import { fetchApiWidgetData } from '@/services/api-fetcher';

export async function synthesizeWidgetFromPrompt(promptText: string): Promise<CustomWidget> {
    const query = promptText.trim();
    if (!query) {
        throw new Error('Prompt cannot be empty.');
    }

    const lower = query.toLowerCase();
    let synthesized: CustomWidget;

    if (lower.includes('weather') || lower.includes('forecast') || lower.includes('temperature') || lower.includes('celsius') || lower.includes('fahrenheit')) {
        let targetCity = 'Tokyo';
        const inMatch = query.match(/(?:in|for|at)\s+([A-Za-z\s]+)/i);
        if (inMatch && inMatch[1]) {
            targetCity = inMatch[1].trim();
        } else {
            const words = query.split(/\s+/).filter(w => !w.match(/weather|forecast|temperature|live|check|get|the|today|celsius|fahrenheit|in|for|at/i));
            if (words.length > 0) targetCity = words.join(' ');
        }

        const geo = await geocodeCity(targetCity);
        const lat = geo?.lat ?? 35.6895;
        const lon = geo?.lon ?? 139.6917;
        const cityName = geo?.name ?? targetCity;
        const unit = lower.includes('fahrenheit') ? 'fahrenheit' : 'celsius';
        const weatherData = await fetchLiveWeatherData(lat, lon, cityName, unit);

        synthesized = {
            id: `ai_w_${Date.now()}`,
            title: `${cityName} Weather`,
            subtitle: geo?.country ? `${cityName}, ${geo.country}` : 'Live Forecast',
            metric: weatherData.temperature || (unit === 'fahrenheit' ? '72°F' : '22°C'),
            metricLabel: cityName,
            badge: weatherData.condition || 'Clear Sky',
            badgeColor: pandraColors.secondary,
            color: pandraColors.secondary,
            iconType: 'weather',
            type: 'weather',
            size: lower.includes('banner') || lower.includes('wide') ? 'wide' : 'standard',
            cardStyle: 'glass',
            weatherConfig: {
                ...weatherData,
                city: cityName,
                latitude: lat,
                longitude: lon,
                unit,
            },
        };
    }
    
    else if (lower.includes('counter') || lower.includes('tracker') || lower.includes('tally') || lower.includes('intake') || lower.includes('habit')) {
        let unitName = 'Count';
        if (lower.includes('water') || lower.includes('glass')) unitName = 'Glasses';
        else if (lower.includes('pushup') || lower.includes('rep')) unitName = 'Reps';
        else if (lower.includes('task') || lower.includes('todo')) unitName = 'Tasks';
        else if (lower.includes('commit') || lower.includes('deploy')) unitName = 'Deploys';
        else if (lower.includes('coffee')) unitName = 'Cups';

        let initialCount = 0;
        const numMatch = query.match(/\b(\d+)\b/);
        if (numMatch && numMatch[1]) {
            initialCount = parseInt(numMatch[1], 10);
        }

        synthesized = {
            id: `ai_c_${Date.now()}`,
            title: query.length > 25 ? `${unitName} Tracker` : query,
            subtitle: 'Interactive Counter',
            metric: String(initialCount),
            metricLabel: unitName.toUpperCase(),
            badge: 'COUNTER',
            badgeColor: pandraColors.primary,
            color: pandraColors.primary,
            iconType: 'hash',
            type: 'counter',
            size: 'standard',
            cardStyle: 'solid',
            counterConfig: {
                count: initialCount,
                step: 1,
                unitLabel: unitName,
            },
        };
    }
    
    else if (lower.includes('battery') || lower.includes('power') || lower.includes('charge') || lower.includes('charging')) {
        const batt = await fetchLiveBatteryData();
        synthesized = {
            id: `ai_b_${Date.now()}`,
            title: 'Device Power',
            subtitle: 'Hardware Battery',
            metric: `${batt.levelPercent ?? 88}%`,
            metricLabel: batt.isCharging ? 'CHARGING AC' : 'BATTERY LEVEL',
            badge: batt.isCharging ? '⚡ CHARGING' : `${batt.levelPercent ?? 88}%`,
            badgeColor: pandraColors.accentGreen,
            color: pandraColors.accentGreen,
            iconType: 'battery',
            type: 'battery',
            size: 'standard',
            cardStyle: 'glass',
            batteryConfig: batt,
        };
    }
    
    else if (lower.includes('news') || lower.includes('hacker') || lower.includes('feed') || lower.includes('headline')) {
        const news = await fetchLiveNewsData('hackernews');
        synthesized = {
            id: `ai_n_${Date.now()}`,
            title: 'Tech Wire',
            subtitle: 'Hacker News Feed',
            metric: '',
            metricLabel: '',
            badge: 'LIVE NEWS',
            badgeColor: pandraColors.accentPurple,
            color: pandraColors.accentPurple,
            iconType: 'newspaper',
            type: 'news',
            size: 'wide',
            cardStyle: 'glass',
            newsConfig: news,
        };
    }
    
    else if (lower.includes('note') || lower.includes('memo') || lower.includes('sticky') || lower.includes('reminder') || lower.includes('plan')) {
        let noteText = query;
        let tag = 'memo';
        if (lower.includes('sprint')) tag = 'sprint';
        else if (lower.includes('release')) tag = 'release';
        else if (lower.includes('goal')) tag = 'goals';

        synthesized = {
            id: `ai_m_${Date.now()}`,
            title: 'Sticky Memo',
            subtitle: `#${tag}`,
            metric: '',
            metricLabel: '',
            badge: 'NOTE',
            badgeColor: pandraColors.accentAmber,
            color: pandraColors.accentAmber,
            iconType: 'file-text',
            type: 'note',
            size: 'standard',
            cardStyle: 'solid',
            noteConfig: {
                text: noteText,
                tag,
            },
        };
    }
    
    else if (lower.includes('photo') || lower.includes('image') || lower.includes('picture') || lower.includes('wallpaper') || lower.includes('cyberpunk') || lower.includes('tokyo')) {
        let imgUrl = 'https://images.unsplash.com/photo-1550745165-9bc0b252726f?w=400&h=400&fit=crop';
        if (lower.includes('space') || lower.includes('galaxy')) {
            imgUrl = 'https://images.unsplash.com/photo-1462331940025-496dfbfc7564?w=400&h=400&fit=crop';
        } else if (lower.includes('circuit') || lower.includes('code') || lower.includes('neon')) {
            imgUrl = 'https://images.unsplash.com/photo-1526374965328-7f61d4dc18c5?w=400&h=400&fit=crop';
        } else if (lower.includes('nature') || lower.includes('mountain')) {
            imgUrl = 'https://images.unsplash.com/photo-1506905925346-21bda4d32df4?w=400&h=400&fit=crop';
        }

        synthesized = {
            id: `ai_p_${Date.now()}`,
            title: 'Visual Focus',
            subtitle: query.length > 25 ? 'Curated Photo' : query,
            metric: '',
            metricLabel: '',
            badge: 'PHOTO',
            badgeColor: pandraColors.primary,
            color: pandraColors.primary,
            iconType: 'image',
            type: 'photo',
            size: 'wide',
            cardStyle: 'glass',
            photoConfig: {
                imageUrl: imgUrl,
                caption: query,
            },
        };
    }
    
    else if (lower.includes('github') || lower.includes('repo') || lower.includes('stars')) {
        const repoMatch = query.match(/([a-zA-Z0-9_\-\.]+)\/([a-zA-Z0-9_\-\.]+)/);
        const repoPath = repoMatch ? `${repoMatch[1]}/${repoMatch[2]}` : 'expo/expo';
        const endpoint = `https://api.github.com/repos/${repoPath}`;

        const apiRes = await fetchApiWidgetData({
            endpointUrl: endpoint,
            jsonPath: 'stargazers_count',
            pollIntervalSec: 60,
            unit: '★',
        });

        synthesized = {
            id: `ai_gh_${Date.now()}`,
            title: repoPath.split('/')[1] || 'Repository',
            subtitle: repoPath,
            metric: apiRes.success ? apiRes.value : '★ 35k+',
            metricLabel: 'GITHUB STARS',
            badge: 'GITHUB API',
            badgeColor: '#38BDF8',
            color: '#38BDF8',
            iconType: 'code',
            type: 'api_fetcher',
            size: 'standard',
            cardStyle: 'glass',
            sparklinePattern: 'growth',
            apiConfig: {
                endpointUrl: endpoint,
                jsonPath: 'stargazers_count',
                pollIntervalSec: 60,
                unit: '★',
                lastFetched: Date.now(),
                lastStatus: 'success',
            },
        };
    }
    
    else if (lower.includes('btc') || lower.includes('bitcoin') || lower.includes('crypto') || lower.includes('sol') || lower.includes('solana') || lower.includes('eth')) {
        const isSol = lower.includes('sol');
        const isEth = lower.includes('eth');
        const coinTitle = isSol ? 'Solana Oracle' : isEth ? 'Ethereum Oracle' : 'Bitcoin Oracle';
        const coinSubtitle = isSol ? 'SOL / USD Feed' : isEth ? 'ETH / USD Feed' : 'Coinbase USD Feed';
        const coinColor = isSol ? '#8B5CF6' : isEth ? '#6366F1' : '#F59E0B';
        const endpoint = isSol
            ? 'https://api.coingecko.com/api/v3/simple/price?ids=solana&vs_currencies=usd'
            : isEth
            ? 'https://api.coinbase.com/v2/prices/ETH-USD/spot'
            : 'https://api.coinbase.com/v2/prices/BTC-USD/spot';
        const jsonPath = isSol ? 'solana.usd' : isEth ? 'ethereum.usd' : 'data.amount';

        synthesized = {
            id: `ai_crypto_${Date.now()}`,
            title: coinTitle,
            subtitle: coinSubtitle,
            metric: isSol ? '$184.20' : isEth ? '$3,120.00' : '$96,480.00',
            metricLabel: 'USD PRICE INDEX',
            badge: 'LIVE ORACLE',
            badgeColor: coinColor,
            color: coinColor,
            iconType: 'globe',
            type: 'api_fetcher',
            size: 'standard',
            cardStyle: 'glass',
            sparklinePattern: 'volatile',
            trend: { value: '+6.4%', isPositive: true },
            apiConfig: {
                endpointUrl: endpoint,
                jsonPath,
                pollIntervalSec: 30,
                unit: 'USD',
            },
        };
    }
    
    else {
        synthesized = {
            id: `ai_stat_${Date.now()}`,
            title: query.slice(0, 24),
            subtitle: 'AI Telemetry Oracle',
            metric: '99.98%',
            metricLabel: 'SYSTEM HEALTH',
            badge: 'HEALTHY',
            badgeColor: pandraColors.accentGreen,
            color: pandraColors.accentGreen,
            iconType: 'telemetry',
            type: 'static',
            size: 'standard',
            cardStyle: 'glass',
            sparklinePattern: 'growth',
            trend: { value: '+14.2%', isPositive: true },
        };
    }

    return synthesized;
}
