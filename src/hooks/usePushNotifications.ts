/* eslint-disable @typescript-eslint/no-explicit-any */
import { useState, useEffect, useCallback } from "react";
import { supabase } from "@/integrations/supabase/client";

function urlBase64ToUint8Array(base64String: string): Uint8Array {
  const padding = "=".repeat((4 - (base64String.length % 4)) % 4);
  const base64 = (base64String + padding).replace(/-/g, "+").replace(/_/g, "/");
  const rawData = window.atob(base64);
  const outputArray = new Uint8Array(rawData.length);
  for (let i = 0; i < rawData.length; ++i) {
    outputArray[i] = rawData.charCodeAt(i);
  }
  return outputArray;
}

export const usePushNotifications = (userId: string | undefined) => {
  const [isSupported, setIsSupported] = useState(false);
  const [isSubscribed, setIsSubscribed] = useState(false);
  const [isLoading, setIsLoading] = useState(true);
  const [shouldShowModal, setShouldShowModal] = useState(false);

  useEffect(() => {
    const supported = "serviceWorker" in navigator && "PushManager" in window && "Notification" in window;
    setIsSupported(supported);
    if (!supported) setIsLoading(false);
  }, []);

  useEffect(() => {
    if (!isSupported || !userId) {
      setIsLoading(false);
      return;
    }

    const checkSubscription = async () => {
      try {
        const registration = await navigator.serviceWorker.ready;
        const subscription = await (registration as any).pushManager?.getSubscription();

        if (subscription) {
          const { data, error } = await supabase
            .from("push_subscriptions")
            .select("endpoint")
            .eq("user_id", userId);

          if (error) throw error;

          const exists = data?.some((row) => row.endpoint === subscription.endpoint) ?? false;

          setIsSubscribed(exists);
          setShouldShowModal(!exists && Notification.permission === "default");
        } else {
          setIsSubscribed(false);
          const dismissed = sessionStorage.getItem("push_modal_dismissed");
          setShouldShowModal(Notification.permission === "default" && !dismissed);
        }
      } catch (err) {
        console.error("[Push] Error checking subscription:", err);
      } finally {
        setIsLoading(false);
      }
    };

    checkSubscription();
  }, [isSupported, userId]);

  const subscribe = useCallback(async (): Promise<boolean> => {
    if (!isSupported || !userId) return false;

    try {
      const permission = await Notification.requestPermission();
      if (permission !== "granted") return false;

      const registration = await navigator.serviceWorker.register("/sw.js");
      await navigator.serviceWorker.ready;

      const vapidPublicKey = import.meta.env.VITE_VAPID_PUBLIC_KEY;
      if (!vapidPublicKey) {
        console.error("[Push] VITE_VAPID_PUBLIC_KEY não configurada");
        return false;
      }

      const subscription = await (registration as any).pushManager.subscribe({
        userVisibleOnly: true,
        applicationServerKey: urlBase64ToUint8Array(vapidPublicKey),
      });

      const subJson = subscription.toJSON();
      const endpoint = subJson.endpoint;
      const p256dh = subJson.keys?.p256dh || "";
      const auth = subJson.keys?.auth || "";

      const { error } = await supabase.from("push_subscriptions").insert({
        user_id: userId,
        endpoint,
        p256dh,
        auth,
        subscription: JSON.stringify(subscription),
      });

      if (error) {
        console.error("[Push] Erro ao salvar subscription:", error);
        return false;
      }

      setIsSubscribed(true);
      setShouldShowModal(false);
      return true;
    } catch (err) {
      console.error("[Push] Erro ao assinar:", err);
      return false;
    }
  }, [isSupported, userId]);

  const dismiss = useCallback(() => {
    sessionStorage.setItem("push_modal_dismissed", "true");
    setShouldShowModal(false);
  }, []);

  return {
    isSupported,
    isSubscribed,
    isLoading,
    shouldShowModal,
    subscribe,
    dismiss,
  };
};
