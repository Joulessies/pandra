import React from "react";
import { Stack } from 'expo-router';
import { pandraColors } from "@/theme/token";

export default function AuthLayout() {
    return (
        <Stack
            screenOptions={{
                headerShown: false,
                contentStyle: {
                    backgroundColor: pandraColors.bg,
                }
            }}
        >
            <Stack.Screen name="onboarding" />
            <Stack.Screen name="sign-in" />
            <Stack.Screen name="sign-up" />
            <Stack.Screen name="forgot-password" />
        </Stack>
    );
}