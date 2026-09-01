import React, { useState, useEffect, useCallback } from 'react';
import { ScrollView, Modal, TouchableOpacity, Alert, ActivityIndicator, RefreshControl, Platform } from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { useRouter } from 'expo-router';
import { useAppAuth } from '@/providers/auth-provider';
import { YStack, XStack, Text, View, Input } from 'tamagui';
import * as Linking from 'expo-linking';
import {
    LayoutGrid,
    Cpu,
    LogOut,
    Plus,
    Activity,
    Server,
    Zap,
    ShieldCheck,
    Compass,
    Database,
    Radio,
    HardDrive,
    X,
    Sparkles,
    Leaf,
    Sun,
    Cloud,
    Globe,
    Code,
    Battery,
    Newspaper,
    FileText,
    Hash,
    Image as ImageIcon,
    Smartphone,
} from 'lucide-react-native';
import { DraggableWidgetGrid } from '@/components/draggable-widget-grid';
import { PaywallModal } from '@/components/paywall-modal';
import { CustomWidgetBuilderModal } from '@/components/custom-widget-builder-modal';
import { AiWidgetGeneratorModal } from '@/components/ai-widget-generator-modal';
import { WidgetInspectorModal } from '@/components/widget-inspector-modal';
import { FirstLaunchModal } from '@/components/first-launch-modal';
import { HomeScreenWidgetModal } from '@/components/home-screen-widget-modal';
import { syncDeckToNativeWidgets } from '@/services/native-widget-bridge';
import { pandraColors, fonts, radius, shadows } from '@/theme/token';
import { useRevenueCat } from '@/hooks/use-revenue-cat';
import { CustomWidget, DeckWorkspace } from '@/types/widget';
import {
    loadUserWidgets,
    addUserWidget,
    updateUserWidget,
    hasSeenFirstLaunchTour,
    markFirstLaunchTourSeen,
    getOnboardingRolePreference,
    ONBOARDING_ROLES,
    loadUserWorkspaces,
    getActiveWorkspaceId,
    setActiveWorkspaceId,
    createWorkspace,
    deleteWorkspace,
    updateWorkspaceWidgets,
} from '@/services/widget-storage';
import {
    fetchApiWidgetData,
} from '@/services/api-fetcher';
import {
    measureNetworkLatency,
    fetchLiveWeatherData,
    fetchLiveNewsData,
    fetchLiveBatteryData,
} from '@/services/personal-widget-fetcher';

let ExpoWebBrowser: any = null;
try {
  ExpoWebBrowser = require('expo-web-browser');
} catch {
  ExpoWebBrowser = null;
}

export default function HomeScreen() {
    const insets = useSafeAreaInsets();
    const router = useRouter();
    const { user, clerkUser, logout } = useAppAuth();

    const userEmail = user?.email || 'builder@pandra.dev';
    const userName = user?.name || userEmail.split('@')[0];

    const { isPro, isAdmin, isTrialActive, trialDaysRemaining } = useRevenueCat();
    const [widgets, setWidgets] = useState<CustomWidget[]>([]);
    const [isBuilderModalOpen, setIsBuilderModalOpen] = useState(false);
    const [editingWidget, setEditingWidget] = useState<CustomWidget | null>(null);
    const [isFirstLaunchModalOpen, setIsFirstLaunchModalOpen] = useState(false);
    const [userRoleTitle, setUserRoleTitle] = useState('Fullstack Builder');
    const [isPaywallOpen, setIsPaywallOpen] = useState(false);
    const [paywallContext, setPaywallContext] = useState('');
    const [inspectorWidget, setInspectorWidget] = useState<CustomWidget | null>(null);
    const [workspaces, setWorkspaces] = useState<DeckWorkspace[]>([]);
    const [activeWorkspaceIdState, setActiveWorkspaceIdState] = useState<string>('deck_core');
    const [isOrganizeMode, setIsOrganizeMode] = useState(false);
    const [isNewDeckModalOpen, setIsNewDeckModalOpen] = useState(false);
    const [newDeckName, setNewDeckName] = useState('');
    const [simulatingStream, setSimulatingStream] = useState(false);
    const [latency, setLatency] = useState(14);
    const [rps, setRps] = useState(240);
    const [loggingOut, setLoggingOut] = useState(false);
    const [isAiModalOpen, setIsAiModalOpen] = useState(false);
    const [isHomeScreenModalOpen, setIsHomeScreenModalOpen] = useState(false);
    const [isRefreshing, setIsRefreshing] = useState(false);

    useEffect(() => {
        if (widgets && widgets.length > 0) {
            syncDeckToNativeWidgets(widgets).catch(() => {});
        }
    }, [widgets]);

    useEffect(() => {
        let isMounted = true;
        async function initDeckAndCalibration() {
            try {
                const chosenRole = await getOnboardingRolePreference(user?.id);
                if (isMounted && ONBOARDING_ROLES[chosenRole]) {
                    setUserRoleTitle(ONBOARDING_ROLES[chosenRole].title);
                }

                const seenTour = await hasSeenFirstLaunchTour(user?.id);
                if (isMounted && !seenTour) {
                    setIsFirstLaunchModalOpen(true);
                }

                // Load workspaces
                const userWorkspaces = await loadUserWorkspaces(user?.id, clerkUser);
                const activeId = await getActiveWorkspaceId(user?.id);
                if (isMounted && userWorkspaces.length > 0) {
                    setWorkspaces(userWorkspaces);
                    setActiveWorkspaceIdState(activeId);
                    const currentWs = userWorkspaces.find((ws) => ws.id === activeId) || userWorkspaces[0];
                    if (currentWs) {
                        setWidgets(currentWs.widgets || []);
                    } else {
                        const loaded = await loadUserWidgets(user?.id, clerkUser);
                        setWidgets(loaded || []);
                    }
                } else {
                    const loaded = await loadUserWidgets(user?.id, clerkUser);
                    if (isMounted) setWidgets(loaded || []);
                }

                // Initial auto-calibration ping
                measureNetworkLatency().then((res) => {
                    if (isMounted) {
                        setLatency(res.latencyMs);
                        setRps(res.rps);
                    }
                }).catch(() => {});
            } catch (err) {
                console.error('[Deck] Failed to initialize deck:', err);
            }
        }
        initDeckAndCalibration();
        return () => {
            isMounted = false;
        };
    }, [user?.id, clerkUser]);

    const handleGetStartedFromTour = async () => {
        await markFirstLaunchTourSeen(user?.id);
        setIsFirstLaunchModalOpen(false);
        handleMeasurePing();
    };

    // 2. Background polling for active widgets
    useEffect(() => {
        const pollAllWidgets = async () => {
            let hasChanges = false;
            const updated = await Promise.all(
                widgets.map(async (w) => {
                    if (w.type === 'api_fetcher' && w.apiConfig) {
                        try {
                            const res = await fetchApiWidgetData(w.apiConfig);
                            if (res.success && res.value !== w.metric) {
                                hasChanges = true;
                                return {
                                    ...w,
                                    metric: res.value,
                                    badge: res.badge,
                                    badgeColor: res.badgeColor || w.color,
                                    apiConfig: {
                                        ...w.apiConfig,
                                        lastFetched: Date.now(),
                                        lastStatus: 'success' as const,
                                    },
                                };
                            }
                        } catch (err) {
                            console.warn('[Poller] API error:', err);
                        }
                    } else if (w.type === 'weather' && w.weatherConfig) {
                        try {
                            const res = await fetchLiveWeatherData(
                                w.weatherConfig.latitude,
                                w.weatherConfig.longitude,
                                w.weatherConfig.city,
                                w.weatherConfig.unit
                            );
                            if (res.temperature && res.temperature !== w.metric) {
                                hasChanges = true;
                                return {
                                    ...w,
                                    metric: res.temperature,
                                    badge: (res.condition || 'CLEAR').toUpperCase(),
                                    weatherConfig: res,
                                };
                            }
                        } catch (err) {
                            console.warn('[Poller] Weather error:', err);
                        }
                    } else if (w.type === 'battery') {
                        try {
                            const res = await fetchLiveBatteryData();
                            const pct = `${Math.round(res.levelPercent ?? 100)}%`;
                            if (pct !== w.metric) {
                                hasChanges = true;
                                return {
                                    ...w,
                                    metric: pct,
                                    badge: res.isCharging ? '⚡ CHARGING' : pct,
                                    batteryConfig: res,
                                };
                            }
                        } catch (err) {
                            console.warn('[Poller] Battery error:', err);
                        }
                    }
                    return w;
                })
            );

            if (hasChanges) {
                setWidgets(updated);
                await updateWorkspaceWidgets(activeWorkspaceIdState, updated, user?.id, clerkUser);
            }

            // Evaluate Alert Rules for active widgets
            updated.forEach((w) => {
                if (w.alertRules && w.alertRules.length > 0) {
                    w.alertRules.forEach((rule) => {
                        if (rule.enabled) {
                            const rawNum = parseFloat((w.metric || '0').replace(/[^0-9.-]+/g, ''));
                            if (!isNaN(rawNum)) {
                                let triggered = false;
                                if (rule.condition === 'gt' && rawNum > rule.threshold) triggered = true;
                                if (rule.condition === 'lt' && rawNum < rule.threshold) triggered = true;
                                if (rule.condition === 'eq' && Math.abs(rawNum - rule.threshold) < 0.001) triggered = true;

                                const tenMin = 10 * 60 * 1000;
                                if (triggered && (!rule.lastTriggered || Date.now() - rule.lastTriggered > tenMin)) {
                                    rule.lastTriggered = Date.now();
                                    Alert.alert('⚡ Alert Triggered', `${w.title}: ${rule.notifyMessage || 'Target reached'} (${w.metric})`);
                                }
                            }
                        }
                    });
                }
            });
        };

        const pollerTimer = setInterval(pollAllWidgets, 45000);
        return () => clearInterval(pollerTimer);
    }, [widgets, user?.id, activeWorkspaceIdState, clerkUser]);

    // Real live network latency & telemetry poller
    useEffect(() => {
        const updateLiveTelemetry = async () => {
            try {
                const res = await measureNetworkLatency();
                setLatency(res.latencyMs);
                setRps(res.rps);
            } catch {}
        };
        updateLiveTelemetry();
        const timer = setInterval(updateLiveTelemetry, 15000);
        return () => clearInterval(timer);
    }, []);

    // Pull-to-refresh handler
    const handlePullRefresh = useCallback(async () => {
        setIsRefreshing(true);
        try {
            const updated = await Promise.all(
                widgets.map(async (w) => {
                    if (w.type === 'api_fetcher' && w.apiConfig) {
                        try {
                            const res = await fetchApiWidgetData(w.apiConfig);
                            if (res.success) {
                                return {
                                    ...w,
                                    metric: res.value,
                                    badge: res.badge,
                                    badgeColor: res.badgeColor || w.color,
                                    apiConfig: {
                                        ...w.apiConfig,
                                        lastFetched: Date.now(),
                                        lastStatus: 'success' as const,
                                    },
                                };
                            }
                        } catch {}
                    } else if (w.type === 'weather' && w.weatherConfig) {
                        try {
                            const res = await fetchLiveWeatherData(
                                w.weatherConfig.latitude,
                                w.weatherConfig.longitude,
                                w.weatherConfig.city,
                                w.weatherConfig.unit
                            );
                            return {
                                ...w,
                                metric: res.temperature || '22°C',
                                badge: (res.condition || 'CLEAR').toUpperCase(),
                                weatherConfig: res,
                            };
                        } catch {}
                    } else if (w.type === 'news' && w.newsConfig) {
                        try {
                            const res = await fetchLiveNewsData(w.newsConfig.source);
                            return {
                                ...w,
                                metric: res.headline || 'Top Story',
                                badge: (res.source || 'NEWS').toUpperCase(),
                                subtitle: `${res.timeAgo || 'Live'} • Tap to read`,
                                newsConfig: res,
                            };
                        } catch {}
                    } else if (w.type === 'battery') {
                        try {
                            const res = await fetchLiveBatteryData();
                            const pct = `${Math.round(res.levelPercent ?? 100)}%`;
                            return {
                                ...w,
                                metric: pct,
                                badge: res.isCharging ? '⚡ CHARGING' : pct,
                                batteryConfig: res,
                            };
                        } catch {}
                    }
                    return w;
                })
            );
            setWidgets(updated);
            await updateWorkspaceWidgets(activeWorkspaceIdState, updated, user?.id, clerkUser);
            await measureNetworkLatency().then((res) => {
                setLatency(res.latencyMs);
                setRps(res.rps);
            }).catch(() => {});
        } finally {
            setIsRefreshing(false);
        }
    }, [widgets, user?.id, activeWorkspaceIdState, clerkUser]);

    const handleLogout = async () => {
        try {
            setLoggingOut(true);
            await logout();
            router.replace('/(auth)/onboarding' as any);
        } catch (err) {
            console.error('Logout error:', err);
            router.replace('/(auth)/onboarding' as any);
        } finally {
            setLoggingOut(false);
        }
    };

    const handleOpenAddWidget = () => {
        if (!isPro && widgets.length >= 4) {
            setPaywallContext('Free tier is limited to 4 widgets. Upgrade to Pandra Pro for unlimited widgets.');
            setIsPaywallOpen(true);
            return;
        }
        setEditingWidget(null);
        setIsBuilderModalOpen(true);
    };

    const handleSaveWidget = async (savedWidget: CustomWidget) => {
        const exists = widgets.some((w) => w.id === savedWidget.id);
        let updated: CustomWidget[];
        if (exists) {
            updated = await updateUserWidget(savedWidget, user?.id, clerkUser);
        } else {
            if (!isPro && widgets.length >= 4) {
                setPaywallContext('Free tier is limited to 4 widgets. Upgrade to Pandra Pro for unlimited widgets.');
                setIsPaywallOpen(true);
                return;
            }
            updated = await addUserWidget(savedWidget, user?.id, clerkUser);
        }
        setWidgets(updated);
        setEditingWidget(null);
    };

    const handleSwitchWorkspace = async (wsId: string) => {
        // Sync current widgets
        await updateWorkspaceWidgets(activeWorkspaceIdState, widgets, user?.id, clerkUser);
        setActiveWorkspaceIdState(wsId);
        await setActiveWorkspaceId(wsId, user?.id);

        const target = workspaces.find((ws) => ws.id === wsId);
        if (target) {
            setWidgets(target.widgets);
        }
    };

    const handleCreateNewWorkspace = async () => {
        if (!newDeckName.trim()) return;
        const updated = await createWorkspace(newDeckName.trim(), 'custom', user?.id, clerkUser);
        setWorkspaces(updated);
        const newest = updated[updated.length - 1];
        if (newest) {
            setActiveWorkspaceIdState(newest.id);
            setWidgets(newest.widgets);
        }
        setNewDeckName('');
        setIsNewDeckModalOpen(false);
        Alert.alert('Deck Created', `Workspace "${newDeckName}" is now active.`);
    };

    const handleDeleteWorkspace = async (wsId: string) => {
        if (workspaces.length <= 1) {
            Alert.alert('Cannot Delete', 'You must have at least one active workspace.');
            return;
        }
        Alert.alert('Delete Deck', 'Are you sure you want to delete this workspace deck?', [
            { text: 'Cancel', style: 'cancel' },
            {
                text: 'Delete',
                style: 'destructive',
                onPress: async () => {
                    const remaining = await deleteWorkspace(wsId, user?.id, clerkUser);
                    setWorkspaces(remaining);
                    const nextActive = remaining[0];
                    setActiveWorkspaceIdState(nextActive.id);
                    setWidgets(nextActive.widgets);
                },
            },
        ]);
    };

    const handleMoveWidgetIndex = async (index: number, direction: 'up' | 'down') => {
        const targetIndex = direction === 'up' ? index - 1 : index + 1;
        if (targetIndex < 0 || targetIndex >= widgets.length) return;

        const reordered = [...widgets];
        const temp = reordered[index];
        reordered[index] = reordered[targetIndex];
        reordered[targetIndex] = temp;

        setWidgets(reordered);
        await updateWorkspaceWidgets(activeWorkspaceIdState, reordered, user?.id, clerkUser);
    };

    const handleReorderWidgets = async (reordered: CustomWidget[]) => {
        setWidgets(reordered);
        await updateWorkspaceWidgets(activeWorkspaceIdState, reordered, user?.id, clerkUser);
    };

    const handleToggleWidgetSizeDirect = async (widgetId: string) => {
        const updated = widgets.map((w) => {
            if (w.id === widgetId) {
                return {
                    ...w,
                    size: (w.size === 'wide' ? 'standard' : 'wide') as 'standard' | 'wide',
                };
            }
            return w;
        });
        setWidgets(updated);
        await updateWorkspaceWidgets(activeWorkspaceIdState, updated, user?.id, clerkUser);
    };

    const handleDuplicateWidget = async (widget: CustomWidget) => {
        const cloned: CustomWidget = {
            ...widget,
            id: `clone_${Date.now()}`,
            title: `${widget.title} (Copy)`,
        };
        const updated = [...widgets, cloned];
        setWidgets(updated);
        await updateWorkspaceWidgets(activeWorkspaceIdState, updated, user?.id, clerkUser);
        Alert.alert('Duplicated', `"${cloned.title}" added to deck.`);
    };

    const handleDeleteWidgetDirect = async (widgetId: string, title: string) => {
        Alert.alert('Remove Widget', `Remove "${title}" from your deck?`, [
            { text: 'Cancel', style: 'cancel' },
            {
                text: 'Remove',
                style: 'destructive',
                onPress: async () => {
                    const updated = widgets.filter((w) => w.id !== widgetId);
                    setWidgets(updated);
                    await updateWorkspaceWidgets(activeWorkspaceIdState, updated, user?.id, clerkUser);
                },
            },
        ]);
    };

    const handleUpdateInspectorWidget = async (updatedWidget: CustomWidget) => {
        const updated = widgets.map((w) => (w.id === updatedWidget.id ? updatedWidget : w));
        setWidgets(updated);
        setInspectorWidget(updatedWidget);
        await updateWorkspaceWidgets(activeWorkspaceIdState, updated, user?.id, clerkUser);
    };

    const handleCounterChange = async (widgetId: string, delta: number) => {
        const updated = widgets.map((w) => {
            if (w.id === widgetId && w.counterConfig) {
                const newCount = Math.max((w.counterConfig.count || 0) + delta, 0);
                return {
                    ...w,
                    metric: String(newCount),
                    counterConfig: {
                        ...w.counterConfig,
                        count: newCount,
                    },
                };
            }
            return w;
        });
        setWidgets(updated);
        await updateWorkspaceWidgets(activeWorkspaceIdState, updated, user?.id, clerkUser);
    };

    const handleOpenNewsLink = async (url?: string) => {
        if (!url) return;
        try {
            if (!ExpoWebBrowser) {
                try { ExpoWebBrowser = require('expo-web-browser'); } catch { ExpoWebBrowser = null; }
            }
            if (Platform.OS !== 'web' && ExpoWebBrowser?.openBrowserAsync) {
                await ExpoWebBrowser.openBrowserAsync(url, {
                    presentationStyle: ExpoWebBrowser.WebBrowserPresentationStyle?.PAGE_SHEET,
                    toolbarColor: pandraColors.bg,
                    controlsColor: pandraColors.primary,
                });
            } else {
                await Linking.openURL(url);
            }
        } catch (err) {
            console.warn('[WebBrowser] Failed to open URL:', err);
            Linking.openURL(url).catch(() => {});
        }
    };

    const handleMeasurePing = async () => {
        setSimulatingStream(true);
        try {
            const result = await measureNetworkLatency();
            setLatency(result.latencyMs);
            setRps(result.rps);
        } catch {
            setLatency(14);
            setRps(240);
        } finally {
            setTimeout(() => {
                setSimulatingStream(false);
            }, 700);
        }
    };

    const renderWidgetIcon = (type: CustomWidget['iconType'], color: string) => {
        switch (type) {
            case 'image':
                return <ImageIcon size={15} color={color} />;
            case 'weather':
            case 'sun':
                return <Sun size={15} color={color} />;
            case 'cloud':
                return <Cloud size={15} color={color} />;
            case 'battery':
                return <Battery size={15} color={color} />;
            case 'newspaper':
                return <Newspaper size={15} color={color} />;
            case 'file-text':
                return <FileText size={15} color={color} />;
            case 'hash':
                return <Hash size={15} color={color} />;
            case 'telemetry':
                return <Activity size={15} color={color} />;
            case 'server':
                return <Server size={15} color={color} />;
            case 'compute':
                return <Zap size={15} color={color} />;
            case 'security':
                return <ShieldCheck size={15} color={color} />;
            case 'database':
                return <Database size={15} color={color} />;
            case 'ai':
                return <Cpu size={15} color={color} />;
            case 'webhook':
            case 'api':
                return <Radio size={15} color={color} />;
            case 'globe':
                return <Globe size={15} color={color} />;
            case 'code':
                return <Code size={15} color={color} />;
            case 'storage':
                return <HardDrive size={15} color={color} />;
            case 'leaf':
                return <Leaf size={15} color={color} />;
            default:
                return <LayoutGrid size={15} color={color} />;
        }
    };

    const topPadding = Math.max(insets.top, 16) + 8;
    const bottomPadding = Math.max(insets.bottom, 12);

    return (
        <View flex={1} backgroundColor={pandraColors.bg}>
            <YStack flex={1} backgroundColor={pandraColors.bg}>
                {/* Header */}
                <XStack
                    alignItems="center"
                    justifyContent="space-between"
                    paddingHorizontal={20}
                    paddingTop={topPadding}
                    paddingBottom={14}
                    backgroundColor={pandraColors.bg}
                    zIndex={20}
                >
                    <XStack alignItems="center" gap={10}>

                        <YStack>
                            <Text
                                fontFamily={fonts.bodySemibold}
                                fontSize={16}
                                color={pandraColors.text}
                            >
                                Pandra Deck
                            </Text>
                            <Text
                                fontFamily={fonts.body}
                                fontSize={11}
                                color={pandraColors.textMuted}
                            >
                                Personal Command Center
                            </Text>
                        </YStack>
                    </XStack>

                    <XStack alignItems="center" gap={8}>
                        <TouchableOpacity
                            activeOpacity={0.8}
                            onPress={() => {
                                setPaywallContext(
                                    isPro
                                        ? 'Pro active. Unlimited widgets & telemetry.'
                                        : 'Unlock unlimited widgets, 10s polling, and AI compiler.'
                                );
                                setIsPaywallOpen(true);
                            }}
                            style={{
                                height: 30,
                                paddingHorizontal: 10,
                                borderRadius: radius.xs,
                                backgroundColor: isPro ? 'rgba(16, 185, 129, 0.08)' : pandraColors.surface,
                                flexDirection: 'row',
                                alignItems: 'center',
                                gap: 4,
                            }}
                        >
                            {isAdmin ? (
                                <>
                                    <Zap size={12} color={pandraColors.accentGreen} />
                                    <Text fontFamily={fonts.bodyMedium} fontSize={11} color={pandraColors.accentGreen}>
                                        Admin Pro
                                    </Text>
                                </>
                            ) : isTrialActive ? (
                                <>
                                    <Zap size={12} color={pandraColors.accentGreen} />
                                    <Text fontFamily={fonts.bodyMedium} fontSize={11} color={pandraColors.accentGreen}>
                                        Pro ({trialDaysRemaining}d)
                                    </Text>
                                </>
                            ) : isPro ? (
                                <>
                                    <Zap size={12} color={pandraColors.accentGreen} />
                                    <Text fontFamily={fonts.bodyMedium} fontSize={11} color={pandraColors.accentGreen}>
                                        Pro
                                    </Text>
                                </>
                            ) : (
                                <>
                                    <Sparkles size={12} color={pandraColors.textMuted} />
                                    <Text fontFamily={fonts.bodyMedium} fontSize={11} color={pandraColors.textMuted}>
                                        Pro
                                    </Text>
                                </>
                            )}
                        </TouchableOpacity>

                        <TouchableOpacity
                            activeOpacity={0.7}
                            onPress={() => setIsHomeScreenModalOpen(true)}
                            hitSlop={{ top: 12, bottom: 12, left: 12, right: 12 }}
                            style={{
                                width: 30,
                                height: 30,
                                borderRadius: radius.xs,
                                backgroundColor: pandraColors.surface,
                                alignItems: 'center',
                                justifyContent: 'center',
                            }}
                        >
                            <Smartphone size={14} color={pandraColors.textSecondary} />
                        </TouchableOpacity>

                        <TouchableOpacity
                            activeOpacity={0.7}
                            onPress={handleLogout}
                            disabled={loggingOut}
                            hitSlop={{ top: 16, bottom: 16, left: 16, right: 16 }}
                            style={{
                                width: 30,
                                height: 30,
                                borderRadius: radius.xs,
                                backgroundColor: pandraColors.surface,
                                alignItems: 'center',
                                justifyContent: 'center',
                                opacity: loggingOut ? 0.5 : 1,
                            }}
                        >
                            <LogOut size={14} color={pandraColors.textMuted} />
                        </TouchableOpacity>
                    </XStack>
                </XStack>

                <ScrollView
                    contentContainerStyle={{
                        paddingHorizontal: 20,
                        paddingBottom: 110,
                    }}
                    showsVerticalScrollIndicator={false}
                    refreshControl={
                        <RefreshControl
                            refreshing={isRefreshing}
                            onRefresh={handlePullRefresh}
                            tintColor={pandraColors.primary}
                            colors={[pandraColors.primary]}
                        />
                    }
                >
                    {/* Multi-Deck Workspace Switcher Strip */}
                    <ScrollView
                        horizontal
                        showsHorizontalScrollIndicator={false}
                        contentContainerStyle={{ gap: 8, paddingVertical: 4 }}
                        style={{ marginBottom: 12 }}
                    >
                        {workspaces.map((ws) => {
                            const isSel = ws.id === activeWorkspaceIdState;
                            return (
                                <TouchableOpacity
                                    key={ws.id}
                                    activeOpacity={0.8}
                                    onPress={() => handleSwitchWorkspace(ws.id)}
                                    onLongPress={() => ws.isCustom && handleDeleteWorkspace(ws.id)}
                                    style={{
                                        paddingHorizontal: 14,
                                        paddingVertical: 7,
                                        borderRadius: radius.full,
                                        backgroundColor: isSel ? pandraColors.primary : pandraColors.surface,
                                        borderWidth: 1,
                                        borderColor: isSel ? pandraColors.primary : pandraColors.borderHighlight,
                                        flexDirection: 'row',
                                        alignItems: 'center',
                                        gap: 6,
                                    }}
                                >
                                    <Text
                                        fontFamily={fonts.bodyMedium}
                                        fontSize={12}
                                        color={isSel ? '#FFF' : pandraColors.textSecondary}
                                    >
                                        {ws.name}
                                    </Text>
                                    <View
                                        paddingHorizontal={6}
                                        paddingVertical={1.5}
                                        borderRadius={radius.full}
                                        backgroundColor={isSel ? 'rgba(255,255,255,0.2)' : pandraColors.surfaceElevated}
                                    >
                                        <Text
                                            fontFamily={fonts.mono}
                                            fontSize={10}
                                            color={isSel ? '#FFF' : pandraColors.textMuted}
                                        >
                                            {ws.widgets.length}
                                        </Text>
                                    </View>
                                </TouchableOpacity>
                            );
                        })}

                        {/* Add Workspace Button */}
                        <TouchableOpacity
                            activeOpacity={0.8}
                            onPress={() => setIsNewDeckModalOpen(true)}
                            style={{
                                paddingHorizontal: 12,
                                paddingVertical: 7,
                                borderRadius: radius.full,
                                backgroundColor: pandraColors.surfaceElevated,
                                borderWidth: 1,
                                borderColor: pandraColors.border,
                                flexDirection: 'row',
                                alignItems: 'center',
                                gap: 4,
                            }}
                        >
                            <Plus size={12} color={pandraColors.primary} />
                            <Text fontFamily={fonts.bodyMedium} fontSize={12} color={pandraColors.primary}>
                                New Deck
                            </Text>
                        </TouchableOpacity>
                    </ScrollView>

                    {/* System Telemetry Banner */}
                    <TouchableOpacity
                        activeOpacity={0.8}
                        onPress={handleMeasurePing}
                    >
                        <XStack
                            backgroundColor={pandraColors.surface}
                            borderRadius={radius.md}
                            paddingVertical={12}
                            paddingHorizontal={16}
                            justifyContent="space-between"
                            alignItems="center"
                            marginBottom={16}
                        >
                            <XStack alignItems="center" gap={6}>
                                <View
                                    width={6}
                                    height={6}
                                    borderRadius={3}
                                    backgroundColor={simulatingStream ? pandraColors.primary : pandraColors.accentGreen}
                                />
                                <Text fontFamily={fonts.body} fontSize={12} color={pandraColors.textSecondary}>
                                    {widgets.length} active widgets
                                </Text>
                            </XStack>

                            <XStack alignItems="center" gap={14}>
                                <XStack alignItems="center" gap={4}>
                                    {simulatingStream && <ActivityIndicator size="small" color={pandraColors.primary} />}
                                    <Text fontFamily={fonts.mono} fontSize={11} color={pandraColors.textMuted}>
                                        {latency}ms ping
                                    </Text>
                                </XStack>
                                <Text fontFamily={fonts.mono} fontSize={11} color={pandraColors.textMuted}>
                                    {rps} r/s
                                </Text>
                            </XStack>
                        </XStack>
                    </TouchableOpacity>

                    {/* AI Widget Generation Bar */}
                    {/* AI Prompt Synthesis Bar */}
                    <TouchableOpacity
                        activeOpacity={0.85}
                        onPress={() => setIsAiModalOpen(true)}
                        style={{
                            backgroundColor: pandraColors.surface,
                            borderRadius: radius.md,
                            paddingHorizontal: 12,
                            paddingVertical: 10,
                            flexDirection: 'row',
                            alignItems: 'center',
                            gap: 10,
                            marginBottom: 16,
                            borderWidth: 1,
                            borderColor: pandraColors.borderHighlight,
                        }}
                    >
                        <View
                            width={28}
                            height={28}
                            borderRadius={radius.xs}
                            backgroundColor={pandraColors.primaryGlow}
                            alignItems="center"
                            justifyContent="center"
                        >
                            <Sparkles size={14} color={pandraColors.primary} />
                        </View>
                        <YStack flex={1}>
                            <Text fontFamily={fonts.bodyMedium} fontSize={12} color={pandraColors.text}>
                                AI Widget Generator
                            </Text>
                            <Text fontFamily={fonts.body} fontSize={10.5} color={pandraColors.textMuted}>
                                Prompt any widget e.g. &quot;Tokyo weather&quot;, &quot;Water counter&quot;
                            </Text>
                        </YStack>
                        <View
                            paddingHorizontal={10}
                            paddingVertical={4}
                            borderRadius={radius.xs}
                            backgroundColor={pandraColors.surfaceElevated}
                        >
                            <Text fontFamily={fonts.bodyMedium} fontSize={11} color={pandraColors.primary}>
                                Prompt AI
                            </Text>
                        </View>
                    </TouchableOpacity>

                    {/* Action Bar */}
                    <XStack gap={8} marginBottom={20}>
                        <TouchableOpacity
                            activeOpacity={0.8}
                            onPress={handleOpenAddWidget}
                            style={{
                                flex: 1,
                                height: 38,
                                borderRadius: radius.sm,
                                backgroundColor: pandraColors.primary,
                                flexDirection: 'row',
                                alignItems: 'center',
                                justifyContent: 'center',
                                gap: 6,
                            }}
                        >
                            <Plus size={14} color="#FFF" />
                            <Text fontFamily={fonts.bodyMedium} fontSize={12} color="#FFF">
                                Create widget
                            </Text>
                        </TouchableOpacity>

                        <TouchableOpacity
                            activeOpacity={0.8}
                            onPress={handleMeasurePing}
                            style={{
                                flex: 1,
                                height: 38,
                                borderRadius: radius.sm,
                                backgroundColor: pandraColors.surface,
                                flexDirection: 'row',
                                alignItems: 'center',
                                justifyContent: 'center',
                                gap: 6,
                            }}
                        >
                            <Radio size={13} color={pandraColors.textMuted} />
                            <Text fontFamily={fonts.bodyMedium} fontSize={12} color={pandraColors.textSecondary}>
                                {simulatingStream ? 'Testing ping…' : 'Ping telemetry'}
                            </Text>
                        </TouchableOpacity>
                    </XStack>

                    {/* Active Widgets Header with Organize Mode Switch */}
                    <YStack gap={12} marginBottom={20}>
                        <XStack alignItems="center" justifyContent="space-between">
                            <XStack alignItems="center" gap={8}>
                                <Text
                                    fontFamily={fonts.bodySemibold}
                                    fontSize={14}
                                    color={pandraColors.text}
                                >
                                    Active widgets
                                </Text>
                                <View
                                    paddingHorizontal={6}
                                    paddingVertical={2}
                                    borderRadius={radius.xs}
                                    backgroundColor={pandraColors.surfaceElevated}
                                >
                                    <Text fontFamily={fonts.mono} fontSize={10} color={pandraColors.textMuted}>
                                        {widgets.length} tiles
                                    </Text>
                                </View>
                            </XStack>

                            <TouchableOpacity
                                activeOpacity={0.8}
                                onPress={() => setIsOrganizeMode(!isOrganizeMode)}
                                style={{
                                    paddingHorizontal: 10,
                                    paddingVertical: 4,
                                    borderRadius: radius.xs,
                                    backgroundColor: isOrganizeMode ? pandraColors.primaryGlow : pandraColors.surface,
                                    borderWidth: 1,
                                    borderColor: isOrganizeMode ? pandraColors.primary : 'transparent',
                                }}
                            >
                                <Text
                                    fontFamily={fonts.bodyMedium}
                                    fontSize={11.5}
                                    color={isOrganizeMode ? pandraColors.primary : pandraColors.textSecondary}
                                >
                                    {isOrganizeMode ? '✓ Done Organizing' : '✋ Organize Deck'}
                                </Text>
                            </TouchableOpacity>
                        </XStack>

                        {/* Empty State */}
                        {widgets.length === 0 && (
                            <YStack
                                backgroundColor={pandraColors.surface}
                                borderRadius={radius.md}
                                padding={32}
                                alignItems="center"
                                gap={12}
                            >
                                <View
                                    width={48}
                                    height={48}
                                    borderRadius={radius.md}
                                    backgroundColor={pandraColors.surfaceElevated}
                                    alignItems="center"
                                    justifyContent="center"
                                >
                                    <LayoutGrid size={22} color={pandraColors.textMuted} />
                                </View>
                                <YStack alignItems="center" gap={4}>
                                    <Text fontFamily={fonts.bodyMedium} fontSize={14} color={pandraColors.text}>
                                        No widgets yet
                                    </Text>
                                    <Text fontFamily={fonts.body} fontSize={12} color={pandraColors.textMuted} textAlign="center">
                                        Personalize your deck with custom photos, weather, battery, news, and API widgets.
                                    </Text>
                                </YStack>
                                <TouchableOpacity
                                    activeOpacity={0.8}
                                    onPress={handleOpenAddWidget}
                                    style={{
                                        height: 36,
                                        paddingHorizontal: 20,
                                        borderRadius: radius.sm,
                                        backgroundColor: pandraColors.primary,
                                        flexDirection: 'row',
                                        alignItems: 'center',
                                        justifyContent: 'center',
                                        gap: 6,
                                        marginTop: 4,
                                    }}
                                >
                                    <Plus size={14} color="#FFFFFF" />
                                    <Text fontFamily={fonts.bodyMedium} fontSize={12} color="#FFFFFF">
                                        Create widget
                                    </Text>
                                </TouchableOpacity>
                            </YStack>
                        )}

                        {/* Interactive Draggable Mixed-Size Widget Grid */}
                        <DraggableWidgetGrid
                            widgets={widgets}
                            isOrganizeMode={isOrganizeMode}
                            onReorder={handleReorderWidgets}
                            onPressWidget={(w) => setInspectorWidget(w)}
                            onToggleWidgetSize={handleToggleWidgetSizeDirect}
                            onDuplicateWidget={handleDuplicateWidget}
                            onDeleteWidget={handleDeleteWidgetDirect}
                            onMoveWidgetIndex={handleMoveWidgetIndex}
                            renderWidgetIcon={renderWidgetIcon}
                            onCounterIncrement={(id) => handleCounterChange(id, 1)}
                            onCounterDecrement={(id) => handleCounterChange(id, -1)}
                            onNewsPress={handleOpenNewsLink}
                        />
                    </YStack>

                    {/* Add Widget Button */}
                    {widgets.length > 0 && (
                        <TouchableOpacity
                            activeOpacity={0.85}
                            onPress={handleOpenAddWidget}
                            style={{
                                height: 48,
                                borderRadius: radius.md,
                                backgroundColor: pandraColors.surface,
                                flexDirection: 'row',
                                alignItems: 'center',
                                justifyContent: 'center',
                                gap: 8,
                            }}
                        >
                            <Plus size={15} color={pandraColors.textSecondary} />
                            <Text
                                fontFamily={fonts.bodyMedium}
                                fontSize={13}
                                color={pandraColors.textSecondary}
                            >
                                Create widget {!isPro && widgets.length >= 4 ? '(Pro)' : ''}
                            </Text>
                        </TouchableOpacity>
                    )}

                    {/* Account Card */}
                    <YStack
                        backgroundColor={pandraColors.surface}
                        borderRadius={radius.md}
                        padding={16}
                        gap={14}
                        marginTop={24}
                    >
                        <XStack justifyContent="space-between" alignItems="center">
                            <XStack alignItems="center" gap={10}>
                                <YStack>
                                    <Text fontFamily={fonts.bodyMedium} fontSize={14} color={pandraColors.text}>
                                        {userName}
                                    </Text>
                                    <Text fontFamily={fonts.body} fontSize={11} color={pandraColors.textMuted}>
                                        {userEmail}
                                    </Text>
                                </YStack>
                            </XStack>
                            <TouchableOpacity
                                activeOpacity={0.8}
                                onPress={() => {
                                    setPaywallContext('Manage your Pandra subscription.');
                                    setIsPaywallOpen(true);
                                }}
                                style={{
                                    paddingHorizontal: 8,
                                    paddingVertical: 4,
                                    borderRadius: radius.xs,
                                    backgroundColor: isPro ? 'rgba(16, 185, 129, 0.08)' : pandraColors.surfaceElevated,
                                }}
                            >
                                <Text
                                    fontFamily={fonts.bodyMedium}
                                    fontSize={11}
                                    color={isPro ? pandraColors.accentGreen : pandraColors.textMuted}
                                >
                                    {isAdmin ? 'Admin Pro' : isPro ? 'Pro' : 'Free'}
                                </Text>
                            </TouchableOpacity>
                        </XStack>

                        <TouchableOpacity
                            activeOpacity={0.85}
                            onPress={handleLogout}
                            disabled={loggingOut}
                            style={{
                                height: 40,
                                borderRadius: radius.sm,
                                backgroundColor: pandraColors.surfaceElevated,
                                flexDirection: 'row',
                                alignItems: 'center',
                                justifyContent: 'center',
                                gap: 6,
                                opacity: loggingOut ? 0.5 : 1,
                            }}
                        >
                            <LogOut size={14} color={pandraColors.textMuted} />
                            <Text
                                fontFamily={fonts.body}
                                fontSize={12}
                                color={pandraColors.textSecondary}
                            >
                                {loggingOut ? 'Signing out…' : 'Sign out'}
                            </Text>
                        </TouchableOpacity>
                    </YStack>
                </ScrollView>

                {/* Bottom Dock */}
                <View
                    position="absolute"
                    bottom={bottomPadding + 6}
                    left={32}
                    right={32}
                    backgroundColor={pandraColors.surfaceGlass}
                    borderRadius={radius.full}
                    paddingVertical={6}
                    paddingHorizontal={16}
                    flexDirection="row"
                    justifyContent="space-around"
                    alignItems="center"
                    zIndex={20}
                    {...shadows.elevated}
                >
                    <TouchableOpacity
                        activeOpacity={0.7}
                        style={{
                            flexDirection: 'row',
                            alignItems: 'center',
                            gap: 6,
                            paddingVertical: 6,
                            paddingHorizontal: 16,
                            borderRadius: radius.full,
                            backgroundColor: pandraColors.surfaceElevated,
                        }}
                        onPress={() => {}}
                    >
                        <LayoutGrid size={14} color={pandraColors.text} />
                        <Text fontFamily={fonts.bodyMedium} fontSize={12} color={pandraColors.text}>
                            Deck
                        </Text>
                    </TouchableOpacity>

                    <TouchableOpacity
                        activeOpacity={0.7}
                        style={{
                            flexDirection: 'row',
                            alignItems: 'center',
                            gap: 6,
                            paddingVertical: 6,
                            paddingHorizontal: 16,
                            borderRadius: radius.full,
                        }}
                        onPress={() => router.push('/explore' as any)}
                    >
                        <Compass size={14} color={pandraColors.textMuted} />
                        <Text fontFamily={fonts.bodyMedium} fontSize={12} color={pandraColors.textMuted}>
                            Studio
                        </Text>
                    </TouchableOpacity>
                </View>

                {/* Widget Inspector Modal Sheet */}
                <WidgetInspectorModal
                    isOpen={!!inspectorWidget}
                    widget={inspectorWidget}
                    onClose={() => setInspectorWidget(null)}
                    onUpdateWidget={handleUpdateInspectorWidget}
                />

                {/* New Workspace Deck Modal */}
                <Modal
                    visible={isNewDeckModalOpen}
                    transparent
                    animationType="fade"
                    onRequestClose={() => setIsNewDeckModalOpen(false)}
                >
                    <View
                        flex={1}
                        backgroundColor="rgba(0,0,0,0.75)"
                        alignItems="center"
                        justifyContent="center"
                        padding={24}
                    >
                        <YStack
                            width="100%"
                            maxWidth={360}
                            backgroundColor={pandraColors.surface}
                            borderRadius={radius.md}
                            padding={20}
                            gap={14}
                            borderWidth={1}
                            borderColor={pandraColors.borderHighlight}
                        >
                            <XStack justifyContent="space-between" alignItems="center">
                                <Text fontFamily={fonts.bodySemibold} fontSize={15} color={pandraColors.text}>
                                    Create New Deck
                                </Text>
                                <TouchableOpacity
                                    activeOpacity={0.7}
                                    onPress={() => setIsNewDeckModalOpen(false)}
                                >
                                    <X size={16} color={pandraColors.textMuted} />
                                </TouchableOpacity>
                            </XStack>

                            <Text fontFamily={fonts.body} fontSize={12} color={pandraColors.textSecondary}>
                                Give your workspace deck a name (e.g. &quot;Trading Desk&quot;, &quot;Daily Habits&quot;, &quot;Kubernetes Cluster&quot;).
                            </Text>

                            <Input
                                height={42}
                                backgroundColor={pandraColors.bg}
                                borderWidth={1}
                                borderColor={pandraColors.border}
                                borderRadius={radius.xs}
                                fontFamily={fonts.body}
                                fontSize={13}
                                color={pandraColors.text}
                                placeholder="Deck Name"
                                placeholderTextColor={pandraColors.textDim as any}
                                value={newDeckName}
                                onChangeText={setNewDeckName}
                                autoFocus
                            />

                            <XStack gap={10} marginTop={4}>
                                <TouchableOpacity
                                    activeOpacity={0.8}
                                    onPress={() => setIsNewDeckModalOpen(false)}
                                    style={{
                                        flex: 1,
                                        height: 38,
                                        borderRadius: radius.xs,
                                        backgroundColor: pandraColors.surfaceElevated,
                                        alignItems: 'center',
                                        justifyContent: 'center',
                                    }}
                                >
                                    <Text fontFamily={fonts.bodyMedium} fontSize={12} color={pandraColors.textSecondary}>
                                        Cancel
                                    </Text>
                                </TouchableOpacity>

                                <TouchableOpacity
                                    activeOpacity={0.8}
                                    onPress={handleCreateNewWorkspace}
                                    style={{
                                        flex: 1,
                                        height: 38,
                                        borderRadius: radius.xs,
                                        backgroundColor: pandraColors.primary,
                                        alignItems: 'center',
                                        justifyContent: 'center',
                                    }}
                                >
                                    <Text fontFamily={fonts.bodyMedium} fontSize={12} color="#FFF">
                                        Create Deck
                                    </Text>
                                </TouchableOpacity>
                            </XStack>
                        </YStack>
                    </View>
                </Modal>

                {/* RevenueCat Paywall Modal */}
                <PaywallModal
                    isOpen={isPaywallOpen}
                    onClose={() => setIsPaywallOpen(false)}
                    featureContext={paywallContext}
                />

                {/* Custom Widget Builder Modal (Photos, Weather, Battery, News, Notes, Counters, APIs) */}
                <CustomWidgetBuilderModal
                    isOpen={isBuilderModalOpen}
                    editingWidget={editingWidget}
                    onClose={() => {
                        setIsBuilderModalOpen(false);
                        setEditingWidget(null);
                    }}
                    onSave={handleSaveWidget}
                />

                {/* AI Widget Generator Modal with Live Real Widget Preview */}
                <AiWidgetGeneratorModal
                    isOpen={isAiModalOpen}
                    onClose={() => setIsAiModalOpen(false)}
                    onSave={async (newWidget) => {
                        const updated = await addUserWidget(newWidget, user?.id);
                        setWidgets(updated);
                        Alert.alert('Widget Deployed', `"${newWidget.title}" added to your Command Deck.`);
                    }}
                />

                {/* First Launch Tour & Welcome Modal */}
                <FirstLaunchModal
                    isOpen={isFirstLaunchModalOpen}
                    userName={userName}
                    userRoleTitle={userRoleTitle}
                    trialDaysRemaining={trialDaysRemaining}
                    onGetStarted={handleGetStartedFromTour}
                />

                {/* Native Home Screen Widgets Exporter & Preview Modal */}
                <HomeScreenWidgetModal
                    isOpen={isHomeScreenModalOpen}
                    onClose={() => setIsHomeScreenModalOpen(false)}
                    widgets={widgets}
                />
            </YStack>
        </View>
    );
}
