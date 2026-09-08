import React, { useState, useEffect, useCallback } from "react";
import {
  ScrollView,
  Modal,
  TouchableOpacity,
  Alert,
  RefreshControl,
  Platform,
} from "react-native";
import { useSafeAreaInsets } from "react-native-safe-area-context";
import { useRouter } from "expo-router";
import { useAppAuth } from "@/providers/auth-provider";
import { YStack, XStack, Text, View, Input } from "tamagui";
import * as Linking from "expo-linking";
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
  Layers,
} from "lucide-react-native";
import { DraggableWidgetGrid } from "@/components/draggable-widget-grid";
import { PaywallModal } from "@/components/paywall-modal";
import { CustomWidgetBuilderModal } from "@/components/custom-widget-builder-modal";
import { AiWidgetGeneratorModal } from "@/components/ai-widget-generator-modal";
import { WidgetInspectorModal } from "@/components/widget-inspector-modal";
import { FirstLaunchModal } from "@/components/first-launch-modal";
import { HomeScreenWidgetModal } from "@/components/home-screen-widget-modal";
import { syncDeckToNativeWidgets } from "@/services/native-widget-bridge";
import { pandraColors, fonts, radius, shadows } from "@/theme/token";
import { useRevenueCat } from "@/hooks/use-revenue-cat";
import { CustomWidget } from "@/types/widget";
import { useUIStore, useWorkspaceStore } from "@/stores";
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
} from "@/services/widget-storage";
import { fetchApiWidgetData } from "@/services/api-fetcher";
import {
  fetchLiveWeatherData,
  fetchLiveNewsData,
  fetchLiveBatteryData,
} from "@/services/personal-widget-fetcher";

let ExpoWebBrowser: any = null;
try {
  ExpoWebBrowser = require("expo-web-browser");
} catch {
  ExpoWebBrowser = null;
}

const INSPIRATION_PILLS = [
  {
    label: "✨ Crypto Oracle",
    prompt: "Bitcoin & Ethereum live price and 24h delta tracker",
  },
  {
    label: "🌤️ Weather Radar",
    prompt: "Live weather widget with temperature and daily forecast",
  },
  {
    label: "🔋 Battery Health",
    prompt: "System battery level and charging status monitor",
  },
  {
    label: "🐙 GitHub Stars",
    prompt: "GitHub repository stargazers and commit pulse counter",
  },
  {
    label: "📰 Tech News",
    prompt: "Hacker News top stories and developer headlines feed",
  },
  {
    label: "💧 Water Counter",
    prompt: "Daily hydration tracker with 8 glasses goal counter",
  },
  {
    label: "🚀 API Health",
    prompt: "Production server health checker with ping latency",
  },
  {
    label: "📝 Quick Memo",
    prompt: "Pinned daily priorities and fast scratchpad memo",
  },
];

export default function HomeScreen() {
  const insets = useSafeAreaInsets();
  const router = useRouter();
  const { user, clerkUser, logout } = useAppAuth();

  const userEmail = user?.email || "builder@pandra.dev";
  const userName = user?.name || userEmail.split("@")[0];

  const { isPro, isAdmin, isTrialActive, trialDaysRemaining } = useRevenueCat();
  const uiStore = useUIStore();
  const workspaceStore = useWorkspaceStore();
  const {
    isBuilderModalOpen,
    isFirstLaunchModalOpen,
    isPaywallOpen,
    paywallContext,
    isAiModalOpen,
    isHomeScreenModalOpen,
    isNewDeckModalOpen,
    isOrganizeMode,
  } = uiStore;
  const {
    widgets,
    editingWidget,
    inspectorWidget,
    workspaces,
    activeWorkspaceId: activeWorkspaceIdState,
    isRefreshing,
    loggingOut,
  } = workspaceStore;
  const [userRoleTitle, setUserRoleTitle] = useState("Fullstack Builder");
  const [newDeckName, setNewDeckName] = useState("");
  const [initialAiPrompt, setInitialAiPrompt] = useState("");
  const [inlinePrompt, setInlinePrompt] = useState("");

  const handleLaunchAiWithPrompt = (promptText: string) => {
    const clean = promptText.trim();
    if (!clean) return;
    setInitialAiPrompt(clean);
    uiStore.setAiModalOpen(true);
  };

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
          uiStore.setFirstLaunchModalOpen(true);
        }

        const userWorkspaces = await loadUserWorkspaces(user?.id, clerkUser);
        const activeId = await getActiveWorkspaceId(user?.id);
        if (isMounted && userWorkspaces.length > 0) {
          workspaceStore.setWorkspaces(userWorkspaces);
          workspaceStore.setActiveWorkspaceId(activeId);
          const currentWs =
            userWorkspaces.find((ws) => ws.id === activeId) ||
            userWorkspaces[0];
          if (currentWs) {
            workspaceStore.setWidgets(currentWs.widgets || []);
          } else {
            const loaded = await loadUserWidgets(user?.id, clerkUser);
            workspaceStore.setWidgets(loaded || []);
          }
        } else {
          const loaded = await loadUserWidgets(user?.id, clerkUser);
          if (isMounted) workspaceStore.setWidgets(loaded || []);
        }
      } catch (err) {
        console.error("[Deck] Failed to initialize deck:", err);
      }
    }
    initDeckAndCalibration();
    return () => {
      isMounted = false;
    };
  }, [user?.id, clerkUser]);

  const handleGetStartedFromTour = async () => {
    await markFirstLaunchTourSeen(user?.id);
    uiStore.setFirstLaunchModalOpen(false);
  };

  useEffect(() => {
    const pollAllWidgets = async () => {
      let hasChanges = false;
      const updated = await Promise.all(
        widgets.map(async (w) => {
          if (w.type === "api_fetcher" && w.apiConfig) {
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
                    lastStatus: "success" as const,
                  },
                };
              }
            } catch (err) {
              console.warn("[Poller] API error:", err);
            }
          } else if (w.type === "weather" && w.weatherConfig) {
            try {
              const res = await fetchLiveWeatherData(
                w.weatherConfig.latitude,
                w.weatherConfig.longitude,
                w.weatherConfig.city,
                w.weatherConfig.unit,
              );
              if (res.temperature && res.temperature !== w.metric) {
                hasChanges = true;
                return {
                  ...w,
                  metric: res.temperature,
                  badge: (res.condition || "CLEAR").toUpperCase(),
                  weatherConfig: res,
                };
              }
            } catch (err) {
              console.warn("[Poller] Weather error:", err);
            }
          } else if (w.type === "battery") {
            try {
              const res = await fetchLiveBatteryData();
              const pct = `${Math.round(res.levelPercent ?? 100)}%`;
              if (pct !== w.metric) {
                hasChanges = true;
                return {
                  ...w,
                  metric: pct,
                  badge: res.isCharging ? "⚡ CHARGING" : pct,
                  batteryConfig: res,
                };
              }
            } catch (err) {
              console.warn("[Poller] Battery error:", err);
            }
          }
          return w;
        }),
      );

      if (hasChanges) {
        workspaceStore.setWidgets(updated);
        await updateWorkspaceWidgets(
          activeWorkspaceIdState,
          updated,
          user?.id,
          clerkUser,
        );
      }

      updated.forEach((w) => {
        if (w.alertRules && w.alertRules.length > 0) {
          w.alertRules.forEach((rule) => {
            if (rule.enabled) {
              const rawNum = parseFloat(
                (w.metric || "0").replace(/[^0-9.-]+/g, ""),
              );
              if (!isNaN(rawNum)) {
                let triggered = false;
                if (rule.condition === "gt" && rawNum > rule.threshold)
                  triggered = true;
                if (rule.condition === "lt" && rawNum < rule.threshold)
                  triggered = true;
                if (
                  rule.condition === "eq" &&
                  Math.abs(rawNum - rule.threshold) < 0.001
                )
                  triggered = true;

                const tenMin = 10 * 60 * 1000;
                if (
                  triggered &&
                  (!rule.lastTriggered ||
                    Date.now() - rule.lastTriggered > tenMin)
                ) {
                  rule.lastTriggered = Date.now();
                  Alert.alert(
                    "⚡ Alert Triggered",
                    `${w.title}: ${rule.notifyMessage || "Target reached"} (${w.metric})`,
                  );
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

  const handlePullRefresh = useCallback(async () => {
    workspaceStore.setRefreshing(true);
    try {
      const updated = await Promise.all(
        widgets.map(async (w) => {
          if (w.type === "api_fetcher" && w.apiConfig) {
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
                    lastStatus: "success" as const,
                  },
                };
              }
            } catch {}
          } else if (w.type === "weather" && w.weatherConfig) {
            try {
              const res = await fetchLiveWeatherData(
                w.weatherConfig.latitude,
                w.weatherConfig.longitude,
                w.weatherConfig.city,
                w.weatherConfig.unit,
              );
              return {
                ...w,
                metric: res.temperature || "22°C",
                badge: (res.condition || "CLEAR").toUpperCase(),
                weatherConfig: res,
              };
            } catch {}
          } else if (w.type === "news" && w.newsConfig) {
            try {
              const res = await fetchLiveNewsData(w.newsConfig.source);
              return {
                ...w,
                metric: res.headline || "Top Story",
                badge: (res.source || "NEWS").toUpperCase(),
                subtitle: `${res.timeAgo || "Live"} • Tap to read`,
                newsConfig: res,
              };
            } catch {}
          } else if (w.type === "battery") {
            try {
              const res = await fetchLiveBatteryData();
              const pct = `${Math.round(res.levelPercent ?? 100)}%`;
              return {
                ...w,
                metric: pct,
                badge: res.isCharging ? "⚡ CHARGING" : pct,
                batteryConfig: res,
              };
            } catch {}
          }
          return w;
        }),
      );
      workspaceStore.setWidgets(updated);
      await updateWorkspaceWidgets(
        activeWorkspaceIdState,
        updated,
        user?.id,
        clerkUser,
      );
    } finally {
      workspaceStore.setRefreshing(false);
    }
  }, [widgets, user?.id, activeWorkspaceIdState, clerkUser]);

  const handleLogout = async () => {
    try {
      workspaceStore.setLoggingOut(true);
      await logout();
      router.replace("/(auth)/onboarding" as any);
    } catch (err) {
      console.error("Logout error:", err);
      router.replace("/(auth)/onboarding" as any);
    } finally {
      workspaceStore.setLoggingOut(false);
    }
  };

  const handleOpenAddWidget = () => {
    if (!isPro && widgets.length >= 4) {
      uiStore.setPaywallOpen(
        true,
        "Free tier is limited to 4 widgets. Upgrade to Pandra Pro for unlimited widgets.",
      );
      return;
    }
    workspaceStore.setEditingWidget(null);
    uiStore.setBuilderModalOpen(true);
  };

  const handleSaveWidget = async (savedWidget: CustomWidget) => {
    const exists = widgets.some((w) => w.id === savedWidget.id);
    let updated: CustomWidget[];
    if (exists) {
      updated = await updateUserWidget(savedWidget, user?.id, clerkUser);
    } else {
      if (!isPro && widgets.length >= 4) {
        uiStore.setPaywallOpen(
          true,
          "Free tier is limited to 4 widgets. Upgrade to Pandra Pro for unlimited widgets.",
        );
        return;
      }
      updated = await addUserWidget(savedWidget, user?.id, clerkUser);
    }
    workspaceStore.setWidgets(updated);
    workspaceStore.setEditingWidget(null);
  };

  const handleSwitchWorkspace = async (wsId: string) => {
    await updateWorkspaceWidgets(
      activeWorkspaceIdState,
      widgets,
      user?.id,
      clerkUser,
    );
    workspaceStore.setActiveWorkspaceId(wsId);
    await setActiveWorkspaceId(wsId, user?.id);

    const target = workspaces.find((ws) => ws.id === wsId);
    if (target) {
      workspaceStore.setWidgets(target.widgets);
    }
  };

  const handleCreateNewWorkspace = async () => {
    if (!newDeckName.trim()) return;
    const updated = await createWorkspace(
      newDeckName.trim(),
      "custom",
      user?.id,
      clerkUser,
    );
    workspaceStore.setWorkspaces(updated);
    const newest = updated[updated.length - 1];
    if (newest) {
      workspaceStore.setActiveWorkspaceId(newest.id);
      workspaceStore.setWidgets(newest.widgets);
    }
    setNewDeckName("");
    uiStore.setNewDeckModalOpen(false);
    Alert.alert("Deck Created", `Workspace "${newDeckName}" is now active.`);
  };

  const handleDeleteWorkspace = async (wsId: string) => {
    if (workspaces.length <= 1) {
      Alert.alert(
        "Cannot Delete",
        "You must have at least one active workspace.",
      );
      return;
    }
    Alert.alert(
      "Delete Deck",
      "Are you sure you want to delete this workspace deck?",
      [
        { text: "Cancel", style: "cancel" },
        {
          text: "Delete",
          style: "destructive",
          onPress: async () => {
            const remaining = await deleteWorkspace(wsId, user?.id, clerkUser);
            workspaceStore.setWorkspaces(remaining);
            const nextActive = remaining[0];
            workspaceStore.setActiveWorkspaceId(nextActive.id);
            workspaceStore.setWidgets(nextActive.widgets);
          },
        },
      ],
    );
  };

  const handleMoveWidgetIndex = async (
    index: number,
    direction: "up" | "down",
  ) => {
    const targetIndex = direction === "up" ? index - 1 : index + 1;
    if (targetIndex < 0 || targetIndex >= widgets.length) return;

    const reordered = [...widgets];
    const temp = reordered[index];
    reordered[index] = reordered[targetIndex];
    reordered[targetIndex] = temp;

    workspaceStore.setWidgets(reordered);
    await updateWorkspaceWidgets(
      activeWorkspaceIdState,
      reordered,
      user?.id,
      clerkUser,
    );
  };

  const handleReorderWidgets = async (reordered: CustomWidget[]) => {
    workspaceStore.setWidgets(reordered);
    await updateWorkspaceWidgets(
      activeWorkspaceIdState,
      reordered,
      user?.id,
      clerkUser,
    );
  };

  const handleToggleWidgetSizeDirect = async (widgetId: string) => {
    const updated = widgets.map((w) => {
      if (w.id === widgetId) {
        return {
          ...w,
          size: (w.size === "wide" ? "standard" : "wide") as
            "standard" | "wide",
        };
      }
      return w;
    });
    workspaceStore.setWidgets(updated);
    await updateWorkspaceWidgets(
      activeWorkspaceIdState,
      updated,
      user?.id,
      clerkUser,
    );
  };

  const handleDuplicateWidget = async (widget: CustomWidget) => {
    const cloned: CustomWidget = {
      ...widget,
      id: `clone_${Date.now()}`,
      title: `${widget.title} (Copy)`,
    };
    const updated = [...widgets, cloned];
    workspaceStore.setWidgets(updated);
    await updateWorkspaceWidgets(
      activeWorkspaceIdState,
      updated,
      user?.id,
      clerkUser,
    );
    Alert.alert("Duplicated", `"${cloned.title}" added to deck.`);
  };

  const handleDeleteWidgetDirect = async (widgetId: string, title: string) => {
    Alert.alert("Remove Widget", `Remove "${title}" from your deck?`, [
      { text: "Cancel", style: "cancel" },
      {
        text: "Remove",
        style: "destructive",
        onPress: async () => {
          const updated = widgets.filter((w) => w.id !== widgetId);
          workspaceStore.setWidgets(updated);
          await updateWorkspaceWidgets(
            activeWorkspaceIdState,
            updated,
            user?.id,
            clerkUser,
          );
        },
      },
    ]);
  };

  const handleUpdateInspectorWidget = async (updatedWidget: CustomWidget) => {
    const updated = widgets.map((w) =>
      w.id === updatedWidget.id ? updatedWidget : w,
    );
    workspaceStore.setWidgets(updated);
    workspaceStore.setInspectorWidget(updatedWidget);
    await updateWorkspaceWidgets(
      activeWorkspaceIdState,
      updated,
      user?.id,
      clerkUser,
    );
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
    workspaceStore.setWidgets(updated);
    await updateWorkspaceWidgets(
      activeWorkspaceIdState,
      updated,
      user?.id,
      clerkUser,
    );
  };

  const handleOpenNewsLink = async (url?: string) => {
    if (!url) return;
    try {
      if (!ExpoWebBrowser) {
        try {
          ExpoWebBrowser = require("expo-web-browser");
        } catch {
          ExpoWebBrowser = null;
        }
      }
      if (Platform.OS !== "web" && ExpoWebBrowser?.openBrowserAsync) {
        await ExpoWebBrowser.openBrowserAsync(url, {
          presentationStyle:
            ExpoWebBrowser.WebBrowserPresentationStyle?.PAGE_SHEET,
          toolbarColor: pandraColors.bg,
          controlsColor: pandraColors.primary,
        });
      } else {
        await Linking.openURL(url);
      }
    } catch (err) {
      console.warn("[WebBrowser] Failed to open URL:", err);
      Linking.openURL(url).catch(() => {});
    }
  };

  const renderWidgetIcon = (type: CustomWidget["iconType"], color: string) => {
    switch (type) {
      case "image":
        return <ImageIcon size={15} color={color} />;
      case "weather":
      case "sun":
        return <Sun size={15} color={color} />;
      case "cloud":
        return <Cloud size={15} color={color} />;
      case "battery":
        return <Battery size={15} color={color} />;
      case "newspaper":
        return <Newspaper size={15} color={color} />;
      case "file-text":
        return <FileText size={15} color={color} />;
      case "hash":
        return <Hash size={15} color={color} />;
      case "telemetry":
        return <Activity size={15} color={color} />;
      case "server":
        return <Server size={15} color={color} />;
      case "compute":
        return <Zap size={15} color={color} />;
      case "security":
        return <ShieldCheck size={15} color={color} />;
      case "database":
        return <Database size={15} color={color} />;
      case "ai":
        return <Cpu size={15} color={color} />;
      case "webhook":
      case "api":
        return <Radio size={15} color={color} />;
      case "globe":
        return <Globe size={15} color={color} />;
      case "code":
        return <Code size={15} color={color} />;
      case "storage":
        return <HardDrive size={15} color={color} />;
      case "leaf":
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
        {}
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
                Pandra
              </Text>
              <Text
                fontFamily={fonts.body}
                fontSize={11}
                color={pandraColors.textMuted}
              >
                AI Widget Maker
              </Text>
            </YStack>
          </XStack>

          <XStack alignItems="center" gap={8}>
            <TouchableOpacity
              activeOpacity={0.8}
              onPress={() => {
                uiStore.setPaywallOpen(
                  true,
                  isPro
                    ? "Pro active. Unlimited widgets & telemetry."
                    : "Unlock unlimited widgets, 10s polling, and AI compiler.",
                );
              }}
              style={{
                height: 30,
                paddingHorizontal: 10,
                borderRadius: radius.xs,
                backgroundColor: isPro
                  ? "rgba(16, 185, 129, 0.08)"
                  : pandraColors.surface,
                flexDirection: "row",
                alignItems: "center",
                gap: 4,
              }}
            >
              {isAdmin ? (
                <>
                  <Zap size={12} color={pandraColors.accentGreen} />
                  <Text
                    fontFamily={fonts.bodyMedium}
                    fontSize={11}
                    color={pandraColors.accentGreen}
                  >
                    Admin Pro
                  </Text>
                </>
              ) : isTrialActive ? (
                <>
                  <Zap size={12} color={pandraColors.accentGreen} />
                  <Text
                    fontFamily={fonts.bodyMedium}
                    fontSize={11}
                    color={pandraColors.accentGreen}
                  >
                    Pro ({trialDaysRemaining}d)
                  </Text>
                </>
              ) : isPro ? (
                <>
                  <Zap size={12} color={pandraColors.accentGreen} />
                  <Text
                    fontFamily={fonts.bodyMedium}
                    fontSize={11}
                    color={pandraColors.accentGreen}
                  >
                    Pro
                  </Text>
                </>
              ) : (
                <>
                  <Sparkles size={12} color={pandraColors.textMuted} />
                  <Text
                    fontFamily={fonts.bodyMedium}
                    fontSize={11}
                    color={pandraColors.textMuted}
                  >
                    Pro
                  </Text>
                </>
              )}
            </TouchableOpacity>

            <TouchableOpacity
              activeOpacity={0.7}
              onPress={() => uiStore.setHomeScreenModalOpen(true)}
              hitSlop={{ top: 12, bottom: 12, left: 12, right: 12 }}
              style={{
                width: 30,
                height: 30,
                borderRadius: radius.xs,
                backgroundColor: pandraColors.surface,
                alignItems: "center",
                justifyContent: "center",
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
                alignItems: "center",
                justifyContent: "center",
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
          {}
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
                  onLongPress={() =>
                    ws.isCustom && handleDeleteWorkspace(ws.id)
                  }
                  style={{
                    paddingHorizontal: 14,
                    paddingVertical: 7,
                    borderRadius: radius.full,
                    backgroundColor: isSel
                      ? pandraColors.primary
                      : pandraColors.surface,
                    borderWidth: 1,
                    borderColor: isSel
                      ? pandraColors.primary
                      : pandraColors.borderHighlight,
                    flexDirection: "row",
                    alignItems: "center",
                    gap: 6,
                  }}
                >
                  <Text
                    fontFamily={fonts.bodyMedium}
                    fontSize={12}
                    color={isSel ? "#FFF" : pandraColors.textSecondary}
                  >
                    {ws.name}
                  </Text>
                  <View
                    paddingHorizontal={6}
                    paddingVertical={1.5}
                    borderRadius={radius.full}
                    backgroundColor={
                      isSel
                        ? "rgba(255,255,255,0.2)"
                        : pandraColors.surfaceElevated
                    }
                  >
                    <Text
                      fontFamily={fonts.mono}
                      fontSize={10}
                      color={isSel ? "#FFF" : pandraColors.textMuted}
                    >
                      {ws.widgets.length}
                    </Text>
                  </View>
                </TouchableOpacity>
              );
            })}

            {}
            <TouchableOpacity
              activeOpacity={0.8}
              onPress={() => uiStore.setNewDeckModalOpen(true)}
              style={{
                paddingHorizontal: 12,
                paddingVertical: 7,
                borderRadius: radius.full,
                backgroundColor: pandraColors.surfaceElevated,
                borderWidth: 1,
                borderColor: pandraColors.border,
                flexDirection: "row",
                alignItems: "center",
                gap: 4,
              }}
            >
              <Plus size={12} color={pandraColors.primary} />
              <Text
                fontFamily={fonts.bodyMedium}
                fontSize={12}
                color={pandraColors.primary}
              >
                New Deck
              </Text>
            </TouchableOpacity>
          </ScrollView>

          {}
          <XStack
            backgroundColor={pandraColors.surface}
            borderRadius={radius.md}
            paddingVertical={10}
            paddingHorizontal={14}
            justifyContent="space-between"
            alignItems="center"
            marginBottom={14}
            borderWidth={1}
            borderColor={pandraColors.border}
          >
            <XStack alignItems="center" gap={7}>
              <View
                width={7}
                height={7}
                borderRadius={4}
                backgroundColor={pandraColors.accentGreen}
              />
              <Text
                fontFamily={fonts.bodyMedium}
                fontSize={12}
                color={pandraColors.text}
              >
                AI Widget Engine
              </Text>
              <View
                paddingHorizontal={6}
                paddingVertical={2}
                borderRadius={radius.xs}
                backgroundColor="rgba(16, 185, 129, 0.12)"
              >
                <Text
                  fontFamily={fonts.mono}
                  fontSize={9.5}
                  color={pandraColors.accentGreen}
                >
                  ONLINE
                </Text>
              </View>
            </XStack>

            <XStack alignItems="center" gap={12}>
              <Text
                fontFamily={fonts.mono}
                fontSize={11}
                color={pandraColors.textMuted}
              >
                {widgets.length} active
              </Text>
              <TouchableOpacity
                activeOpacity={0.7}
                onPress={() => uiStore.setHomeScreenModalOpen(true)}
                style={{
                  flexDirection: "row",
                  alignItems: "center",
                  gap: 4,
                  paddingHorizontal: 8,
                  paddingVertical: 3,
                  borderRadius: radius.xs,
                  backgroundColor: pandraColors.surfaceElevated,
                }}
              >
                <Smartphone size={11} color={pandraColors.primary} />
                <Text
                  fontFamily={fonts.bodyMedium}
                  fontSize={11}
                  color={pandraColors.primary}
                >
                  Phone Sync
                </Text>
              </TouchableOpacity>
            </XStack>
          </XStack>

          {}
          <YStack
            backgroundColor={pandraColors.surface}
            borderRadius={radius.md}
            padding={14}
            gap={12}
            marginBottom={16}
            borderWidth={1}
            borderColor={pandraColors.borderHighlight}
          >
            <XStack alignItems="center" justifyContent="space-between">
              <XStack alignItems="center" gap={6}>
                <View
                  width={24}
                  height={24}
                  borderRadius={radius.xs}
                  backgroundColor={pandraColors.primaryGlow}
                  alignItems="center"
                  justifyContent="center"
                >
                  <Sparkles size={13} color={pandraColors.primary} />
                </View>
                <Text
                  fontFamily={fonts.bodySemibold}
                  fontSize={13}
                  color={pandraColors.text}
                >
                  Generate Any Widget
                </Text>
              </XStack>
              <Text
                fontFamily={fonts.body}
                fontSize={11}
                color={pandraColors.textMuted}
              >
                Natural Language AI
              </Text>
            </XStack>

            <XStack
              backgroundColor={pandraColors.bg}
              borderRadius={radius.sm}
              borderWidth={1}
              borderColor={pandraColors.border}
              alignItems="center"
              paddingHorizontal={12}
              height={46}
              gap={8}
            >
              <Input
                flex={1}
                height={44}
                backgroundColor="transparent"
                borderWidth={0}
                fontFamily={fonts.body}
                fontSize={13}
                color={pandraColors.text}
                placeholder="e.g., Tokyo rain radar, Sol tracker, hydration..."
                placeholderTextColor={pandraColors.textDim as any}
                value={inlinePrompt}
                onChangeText={setInlinePrompt}
                onSubmitEditing={() => {
                  if (inlinePrompt.trim()) {
                    const p = inlinePrompt;
                    setInlinePrompt("");
                    handleLaunchAiWithPrompt(p);
                  }
                }}
                returnKeyType="go"
              />
              <TouchableOpacity
                activeOpacity={0.8}
                onPress={() => {
                  if (inlinePrompt.trim()) {
                    const p = inlinePrompt;
                    setInlinePrompt("");
                    handleLaunchAiWithPrompt(p);
                  } else {
                    uiStore.setAiModalOpen(true);
                  }
                }}
                style={{
                  height: 32,
                  paddingHorizontal: 12,
                  borderRadius: radius.xs,
                  backgroundColor: pandraColors.primary,
                  flexDirection: "row",
                  alignItems: "center",
                  justifyContent: "center",
                  gap: 5,
                }}
              >
                <Sparkles size={12} color="#FFF" />
                <Text
                  fontFamily={fonts.bodyMedium}
                  fontSize={11.5}
                  color="#FFF"
                >
                  Synthesize
                </Text>
              </TouchableOpacity>
            </XStack>

            {}
            <ScrollView
              horizontal
              showsHorizontalScrollIndicator={false}
              contentContainerStyle={{ gap: 6, paddingVertical: 2 }}
            >
              {INSPIRATION_PILLS.map((pill) => (
                <TouchableOpacity
                  key={pill.label}
                  activeOpacity={0.75}
                  onPress={() => handleLaunchAiWithPrompt(pill.prompt)}
                  style={{
                    paddingHorizontal: 10,
                    paddingVertical: 5,
                    borderRadius: radius.full,
                    backgroundColor: pandraColors.surfaceElevated,
                    borderWidth: 1,
                    borderColor: pandraColors.border,
                  }}
                >
                  <Text
                    fontFamily={fonts.bodyMedium}
                    fontSize={11}
                    color={pandraColors.textSecondary}
                  >
                    {pill.label}
                  </Text>
                </TouchableOpacity>
              ))}
            </ScrollView>
          </YStack>

          {}
          <XStack gap={8} marginBottom={20}>
            <TouchableOpacity
              activeOpacity={0.8}
              onPress={() => uiStore.setAiModalOpen(true)}
              style={{
                flex: 1.2,
                height: 40,
                borderRadius: radius.sm,
                backgroundColor: pandraColors.primary,
                flexDirection: "row",
                alignItems: "center",
                justifyContent: "center",
                gap: 6,
              }}
            >
              <Sparkles size={14} color="#FFF" />
              <Text fontFamily={fonts.bodyMedium} fontSize={12} color="#FFF">
                AI Generator
              </Text>
            </TouchableOpacity>

            <TouchableOpacity
              activeOpacity={0.8}
              onPress={() => router.push("/explore")}
              style={{
                flex: 1,
                height: 40,
                borderRadius: radius.sm,
                backgroundColor: pandraColors.surface,
                borderWidth: 1,
                borderColor: pandraColors.border,
                flexDirection: "row",
                alignItems: "center",
                justifyContent: "center",
                gap: 6,
              }}
            >
              <Layers size={13} color={pandraColors.textSecondary} />
              <Text
                fontFamily={fonts.bodyMedium}
                fontSize={12}
                color={pandraColors.textSecondary}
              >
                Blueprints
              </Text>
            </TouchableOpacity>

            <TouchableOpacity
              activeOpacity={0.8}
              onPress={() => uiStore.setHomeScreenModalOpen(true)}
              style={{
                flex: 1,
                height: 40,
                borderRadius: radius.sm,
                backgroundColor: pandraColors.surface,
                borderWidth: 1,
                borderColor: pandraColors.border,
                flexDirection: "row",
                alignItems: "center",
                justifyContent: "center",
                gap: 6,
              }}
            >
              <Smartphone size={13} color={pandraColors.textSecondary} />
              <Text
                fontFamily={fonts.bodyMedium}
                fontSize={12}
                color={pandraColors.textSecondary}
              >
                Pin to Phone
              </Text>
            </TouchableOpacity>
          </XStack>

          {}
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
                  <Text
                    fontFamily={fonts.mono}
                    fontSize={10}
                    color={pandraColors.textMuted}
                  >
                    {widgets.length} tiles
                  </Text>
                </View>
              </XStack>

              <TouchableOpacity
                activeOpacity={0.8}
                onPress={() => uiStore.setOrganizeMode(!isOrganizeMode)}
                style={{
                  paddingHorizontal: 10,
                  paddingVertical: 4,
                  borderRadius: radius.xs,
                  backgroundColor: isOrganizeMode
                    ? pandraColors.primaryGlow
                    : pandraColors.surface,
                  borderWidth: 1,
                  borderColor: isOrganizeMode
                    ? pandraColors.primary
                    : "transparent",
                }}
              >
                <Text
                  fontFamily={fonts.bodyMedium}
                  fontSize={11.5}
                  color={
                    isOrganizeMode
                      ? pandraColors.primary
                      : pandraColors.textSecondary
                  }
                >
                  {isOrganizeMode ? "✓ Done Organizing" : "✋ Organize Deck"}
                </Text>
              </TouchableOpacity>
            </XStack>

            {}
            {widgets.length === 0 && (
              <YStack
                backgroundColor={pandraColors.surface}
                borderRadius={radius.md}
                padding={28}
                alignItems="center"
                gap={14}
                borderWidth={1}
                borderColor={pandraColors.borderHighlight}
              >
                <View
                  width={52}
                  height={52}
                  borderRadius={radius.md}
                  backgroundColor={pandraColors.primaryGlow}
                  alignItems="center"
                  justifyContent="center"
                >
                  <Sparkles size={24} color={pandraColors.primary} />
                </View>
                <YStack alignItems="center" gap={4}>
                  <Text
                    fontFamily={fonts.bodySemibold}
                    fontSize={15}
                    color={pandraColors.text}
                  >
                    Your AI Widget Canvas is Ready
                  </Text>
                  <Text
                    fontFamily={fonts.body}
                    fontSize={12}
                    color={pandraColors.textMuted}
                    textAlign="center"
                    maxWidth={280}
                  >
                    Describe any widget idea with natural language or pick an AI
                    blueprint to generate your first live tile.
                  </Text>
                </YStack>
                <XStack gap={10} marginTop={4}>
                  <TouchableOpacity
                    activeOpacity={0.85}
                    onPress={() => uiStore.setAiModalOpen(true)}
                    style={{
                      height: 38,
                      paddingHorizontal: 16,
                      borderRadius: radius.sm,
                      backgroundColor: pandraColors.primary,
                      flexDirection: "row",
                      alignItems: "center",
                      justifyContent: "center",
                      gap: 6,
                    }}
                  >
                    <Sparkles size={14} color="#FFFFFF" />
                    <Text
                      fontFamily={fonts.bodyMedium}
                      fontSize={12}
                      color="#FFFFFF"
                    >
                      Generate with AI
                    </Text>
                  </TouchableOpacity>

                  <TouchableOpacity
                    activeOpacity={0.8}
                    onPress={() => router.push("/explore")}
                    style={{
                      height: 38,
                      paddingHorizontal: 14,
                      borderRadius: radius.sm,
                      backgroundColor: pandraColors.surfaceElevated,
                      borderWidth: 1,
                      borderColor: pandraColors.border,
                      flexDirection: "row",
                      alignItems: "center",
                      justifyContent: "center",
                      gap: 6,
                    }}
                  >
                    <Layers size={13} color={pandraColors.textSecondary} />
                    <Text
                      fontFamily={fonts.bodyMedium}
                      fontSize={12}
                      color={pandraColors.textSecondary}
                    >
                      Blueprints
                    </Text>
                  </TouchableOpacity>
                </XStack>
              </YStack>
            )}

            {}
            <DraggableWidgetGrid
              widgets={widgets}
              isOrganizeMode={isOrganizeMode}
              onReorder={handleReorderWidgets}
              onPressWidget={(w) => workspaceStore.setInspectorWidget(w)}
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

          {}
          {widgets.length > 0 && (
            <XStack gap={10} alignItems="center">
              <TouchableOpacity
                activeOpacity={0.85}
                onPress={() => uiStore.setAiModalOpen(true)}
                style={{
                  flex: 1,
                  height: 46,
                  borderRadius: radius.md,
                  backgroundColor: pandraColors.primary,
                  flexDirection: "row",
                  alignItems: "center",
                  justifyContent: "center",
                  gap: 7,
                }}
              >
                <Sparkles size={14} color="#FFF" />
                <Text fontFamily={fonts.bodyMedium} fontSize={13} color="#FFF">
                  Prompt with AI {!isPro && widgets.length >= 4 ? "(Pro)" : ""}
                </Text>
              </TouchableOpacity>

              <TouchableOpacity
                activeOpacity={0.85}
                onPress={handleOpenAddWidget}
                style={{
                  height: 46,
                  paddingHorizontal: 14,
                  borderRadius: radius.md,
                  backgroundColor: pandraColors.surface,
                  borderWidth: 1,
                  borderColor: pandraColors.border,
                  flexDirection: "row",
                  alignItems: "center",
                  justifyContent: "center",
                  gap: 6,
                }}
              >
                <Plus size={14} color={pandraColors.textSecondary} />
                <Text
                  fontFamily={fonts.bodyMedium}
                  fontSize={12}
                  color={pandraColors.textSecondary}
                >
                  Builder
                </Text>
              </TouchableOpacity>
            </XStack>
          )}

          {}
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
                  <Text
                    fontFamily={fonts.bodyMedium}
                    fontSize={14}
                    color={pandraColors.text}
                  >
                    {userName}
                  </Text>
                  <Text
                    fontFamily={fonts.body}
                    fontSize={11}
                    color={pandraColors.textMuted}
                  >
                    {userEmail}
                  </Text>
                </YStack>
              </XStack>
              <TouchableOpacity
                activeOpacity={0.8}
                onPress={() => {
                  uiStore.setPaywallOpen(
                    true,
                    "Manage your Pandra subscription.",
                  );
                }}
                style={{
                  paddingHorizontal: 8,
                  paddingVertical: 4,
                  borderRadius: radius.xs,
                  backgroundColor: isPro
                    ? "rgba(16, 185, 129, 0.08)"
                    : pandraColors.surfaceElevated,
                }}
              >
                <Text
                  fontFamily={fonts.bodyMedium}
                  fontSize={11}
                  color={
                    isPro ? pandraColors.accentGreen : pandraColors.textMuted
                  }
                >
                  {isAdmin ? "Admin Pro" : isPro ? "Pro" : "Free"}
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
                flexDirection: "row",
                alignItems: "center",
                justifyContent: "center",
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
                {loggingOut ? "Signing out…" : "Sign out"}
              </Text>
            </TouchableOpacity>
          </YStack>
        </ScrollView>

        {}
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
              flexDirection: "row",
              alignItems: "center",
              gap: 6,
              paddingVertical: 6,
              paddingHorizontal: 16,
              borderRadius: radius.full,
              backgroundColor: pandraColors.surfaceElevated,
            }}
            onPress={() => {}}
          >
            <LayoutGrid size={14} color={pandraColors.text} />
            <Text
              fontFamily={fonts.bodyMedium}
              fontSize={12}
              color={pandraColors.text}
            >
              Deck
            </Text>
          </TouchableOpacity>

          <TouchableOpacity
            activeOpacity={0.7}
            style={{
              flexDirection: "row",
              alignItems: "center",
              gap: 6,
              paddingVertical: 6,
              paddingHorizontal: 16,
              borderRadius: radius.full,
            }}
            onPress={() => router.push("/explore" as any)}
          >
            <Compass size={14} color={pandraColors.textMuted} />
            <Text
              fontFamily={fonts.bodyMedium}
              fontSize={12}
              color={pandraColors.textMuted}
            >
              Studio
            </Text>
          </TouchableOpacity>
        </View>

        {}
        <WidgetInspectorModal
          isOpen={!!inspectorWidget}
          widget={inspectorWidget}
          onClose={() => workspaceStore.setInspectorWidget(null)}
          onUpdateWidget={handleUpdateInspectorWidget}
        />

        {}
        <Modal
          visible={isNewDeckModalOpen}
          transparent
          animationType="fade"
          onRequestClose={() => uiStore.setNewDeckModalOpen(false)}
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
                <Text
                  fontFamily={fonts.bodySemibold}
                  fontSize={15}
                  color={pandraColors.text}
                >
                  Create New Deck
                </Text>
                <TouchableOpacity
                  activeOpacity={0.7}
                  onPress={() => uiStore.setNewDeckModalOpen(false)}
                >
                  <X size={16} color={pandraColors.textMuted} />
                </TouchableOpacity>
              </XStack>

              <Text
                fontFamily={fonts.body}
                fontSize={12}
                color={pandraColors.textSecondary}
              >
                Give your workspace deck a name (e.g. &quot;Trading Desk&quot;,
                &quot;Daily Habits&quot;, &quot;Kubernetes Cluster&quot;).
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
                  onPress={() => uiStore.setNewDeckModalOpen(false)}
                  style={{
                    flex: 1,
                    height: 38,
                    borderRadius: radius.xs,
                    backgroundColor: pandraColors.surfaceElevated,
                    alignItems: "center",
                    justifyContent: "center",
                  }}
                >
                  <Text
                    fontFamily={fonts.bodyMedium}
                    fontSize={12}
                    color={pandraColors.textSecondary}
                  >
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
                    alignItems: "center",
                    justifyContent: "center",
                  }}
                >
                  <Text
                    fontFamily={fonts.bodyMedium}
                    fontSize={12}
                    color="#FFF"
                  >
                    Create Deck
                  </Text>
                </TouchableOpacity>
              </XStack>
            </YStack>
          </View>
        </Modal>

        {}
        <PaywallModal
          isOpen={isPaywallOpen}
          onClose={() => uiStore.setPaywallOpen(false)}
          featureContext={paywallContext}
        />

        {}
        <CustomWidgetBuilderModal
          isOpen={isBuilderModalOpen}
          editingWidget={editingWidget}
          onClose={() => {
            uiStore.setBuilderModalOpen(false);
            workspaceStore.setEditingWidget(null);
          }}
          onSave={handleSaveWidget}
        />

        {}
        <AiWidgetGeneratorModal
          isOpen={isAiModalOpen}
          initialPrompt={initialAiPrompt}
          onClose={() => {
            uiStore.setAiModalOpen(false);
            setInitialAiPrompt("");
          }}
          onSave={async (newWidget) => {
            const updated = await addUserWidget(newWidget, user?.id, clerkUser);
            workspaceStore.setWidgets(updated);
            Alert.alert(
              "Widget Deployed",
              `"${newWidget.title}" added to your dashboard.`,
            );
          }}
        />

        {}
        <FirstLaunchModal
          isOpen={isFirstLaunchModalOpen}
          userName={userName}
          userRoleTitle={userRoleTitle}
          trialDaysRemaining={trialDaysRemaining}
          onGetStarted={handleGetStartedFromTour}
        />

        {}
        <HomeScreenWidgetModal
          isOpen={isHomeScreenModalOpen}
          onClose={() => uiStore.setHomeScreenModalOpen(false)}
          widgets={widgets}
        />
      </YStack>
    </View>
  );
}
