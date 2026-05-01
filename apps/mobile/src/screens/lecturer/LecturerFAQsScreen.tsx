import React, { useState, useRef } from "react";
import {
  View, Text, ScrollView, TextInput, TouchableOpacity,
  ActivityIndicator, KeyboardAvoidingView, Platform,
} from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";
import { Send, Bot, ChevronDown, ChevronUp, Search } from "lucide-react-native";
import { sendChatMessage } from "@notifiu/shared";
import type { ChatMessage } from "@notifiu/shared";

const FAQ_DATA = [
  { category: "Academic", question: "How do I register for modules this semester?", answer: "Log in to the portal, navigate to Module Registration under the Academic tab, and select modules before the registration deadline." },
  { category: "Academic", question: "Where can I find my exam timetable?", answer: "Exam timetables are published in the Events section and sent to your university email two weeks before examinations begin." },
  { category: "Administrative", question: "How do I update my personal contact information?", answer: 'Go to your Profile tab and click "Edit Profile" to update your phone number, address, and other contact details.' },
  { category: "Technical", question: "I cannot log in to my account. What should I do?", answer: 'Try resetting your password using the "Forgot Password" link. If the issue persists, contact IT support.' },
  { category: "General", question: "What are the library opening hours?", answer: "Mon–Fri 8:00 AM – 10:00 PM, Sat 9:00 AM – 6:00 PM, Sun 10:00 AM – 4:00 PM." },
];

type MainView = "home" | "chatbot";

interface Msg { id: number; role: "user" | "assistant"; content: string; }

export default function LecturerFAQsScreen() {
  const [view, setView] = useState<MainView>("home");
  const [search, setSearch] = useState("");
  const [expandedFaq, setExpandedFaq] = useState<number | null>(null);

  // Chat state
  const [messages, setMessages] = useState<Msg[]>([{
    id: 0, role: "assistant",
    content: "Hi! I'm your NotifiU AI assistant. Ask me anything about modules, exams, fees, or how to use the portal.",
  }]);
  const [input, setInput] = useState("");
  const [loading, setLoading] = useState(false);
  const scrollRef = useRef<ScrollView>(null);
  const nextId = useRef(1);

  const filteredFaqs = FAQ_DATA.filter(
    (f) =>
      f.question.toLowerCase().includes(search.toLowerCase()) ||
      f.category.toLowerCase().includes(search.toLowerCase())
  );

  const handleSend = async () => {
    const text = input.trim();
    if (!text || loading) return;
    const userMsg: Msg = { id: nextId.current++, role: "user", content: text };
    setMessages((prev) => [...prev, userMsg]);
    setInput("");
    setLoading(true);
    try {
      const history: ChatMessage[] = [...messages, userMsg]
        .filter((m) => m.id !== 0)
        .map((m) => ({ role: m.role, content: m.content }));
      const res = await sendChatMessage(history);
      setMessages((prev) => [...prev, {
        id: nextId.current++, role: "assistant",
        content: (res.data as { message: string }).message,
      }]);
    } catch {
      setMessages((prev) => [...prev, {
        id: nextId.current++, role: "assistant",
        content: "Sorry, something went wrong. Please try again.",
      }]);
    } finally {
      setLoading(false);
      setTimeout(() => scrollRef.current?.scrollToEnd({ animated: true }), 100);
    }
  };

  // ─── Chatbot View ─────────────────────────────────────────
  if (view === "chatbot") {
    return (
      <SafeAreaView className="flex-1 bg-[#F8F9FA]">
        <KeyboardAvoidingView className="flex-1" behavior={Platform.OS === "ios" ? "padding" : "height"}>
          <View className="px-5 pt-4 pb-3 bg-[#F8F9FA]">
            <TouchableOpacity onPress={() => setView("home")} className="flex-row items-center gap-2 mb-3">
              <Text className="text-gray-400 font-bold text-sm">← Back</Text>
            </TouchableOpacity>
            <Text className="text-xl font-bold text-[#2D3A5D] text-center">How can we help you?</Text>
            <Text className="text-sm text-gray-400 text-center">Ask questions about the portal.</Text>
          </View>
          <ScrollView
            ref={scrollRef}
            className="flex-1 bg-[#F9FAFB] px-4"
            showsVerticalScrollIndicator={false}
            onContentSizeChange={() => scrollRef.current?.scrollToEnd({ animated: true })}
          >
            <View className="py-4 gap-3">
              {messages.map((msg) => (
                <View key={msg.id} className={`flex-row ${msg.role === "user" ? "justify-end" : "justify-start"}`}>
                  {msg.role === "assistant" && (
                    <View className="w-8 h-8 bg-[#FBB017] rounded-full items-center justify-center mr-2 mt-1">
                      <Bot size={14} color="#1A1C2C" />
                    </View>
                  )}
                  <View className={`max-w-[78%] px-4 py-3 rounded-2xl ${msg.role === "user" ? "bg-[#1A1C2C]" : "bg-white border border-gray-200"}`}>
                    <Text className={`text-sm leading-relaxed ${msg.role === "user" ? "text-white" : "text-[#2D3A5D]"}`}>{msg.content}</Text>
                  </View>
                </View>
              ))}
              {loading && (
                <View className="flex-row items-center gap-2">
                  <ActivityIndicator size="small" color="#9CA3AF" />
                  <Text className="text-gray-400 text-sm">Thinking...</Text>
                </View>
              )}
            </View>
          </ScrollView>
          <View className="flex-row items-center gap-3 px-4 py-3 bg-white border-t border-gray-100">
            <TextInput
              value={input}
              onChangeText={setInput}
              placeholder="Ask a question..."
              placeholderTextColor="#9CA3AF"
              className="flex-1 border border-gray-200 rounded-xl px-4 py-3 text-sm text-[#2D3A5D]"
              onSubmitEditing={handleSend}
              returnKeyType="send"
            />
            <TouchableOpacity
              onPress={handleSend}
              disabled={loading || !input.trim()}
              className="bg-[#FBB017] p-3 rounded-xl"
              style={{ opacity: loading || !input.trim() ? 0.5 : 1 }}
            >
              <Send size={18} color="#fff" />
            </TouchableOpacity>
          </View>
        </KeyboardAvoidingView>
      </SafeAreaView>
    );
  }

  // ─── Home View ────────────────────────────────────────────
  return (
    <SafeAreaView className="flex-1 bg-[#F8F9FA]">
      <ScrollView className="flex-1 px-5 pt-4" showsVerticalScrollIndicator={false}>
        <Text className="text-2xl font-bold text-[#2D3A5D] mb-5">FAQ</Text>

        {/* AI Chatbot Card */}
        <TouchableOpacity
          onPress={() => setView("chatbot")}
          className="bg-[#1A1C2C] rounded-2xl p-5 mb-6 flex-row items-center gap-4"
        >
          <View className="w-10 h-10 bg-[#FBB017] rounded-full items-center justify-center">
            <Bot size={20} color="#1A1C2C" />
          </View>
          <View className="flex-1">
            <Text className="text-white font-bold text-sm mb-0.5">NotifiU AI Assistant</Text>
            <Text className="text-gray-400 text-xs">Ask questions about modules, fees, portal & more</Text>
          </View>
          <Text className="text-[#FBB017] text-xl font-bold">›</Text>
        </TouchableOpacity>

        {/* Search */}
        <View className="flex-row items-center bg-white border border-gray-100 rounded-2xl px-4 mb-5">
          <Search size={16} color="#9CA3AF" />
          <TextInput
            value={search}
            onChangeText={setSearch}
            placeholder="Search frequently asked questions..."
            placeholderTextColor="#9CA3AF"
            className="flex-1 py-4 px-3 text-sm text-[#2D3A5D]"
          />
        </View>

        {/* FAQ accordion */}
        <View className="gap-3 pb-8">
          {filteredFaqs.map((faq, idx) => (
            <View key={idx} className="bg-white rounded-2xl overflow-hidden border border-gray-100">
              <TouchableOpacity
                onPress={() => setExpandedFaq(expandedFaq === idx ? null : idx)}
                className="flex-row items-center justify-between px-5 py-4"
              >
                <View className="flex-row items-center gap-3 flex-1">
                  <View className="border border-[#FBB017] rounded-full px-2 py-0.5">
                    <Text className="text-[#FBB017] text-[9px] font-bold uppercase tracking-widest">{faq.category}</Text>
                  </View>
                  <Text className="text-[#2D3A5D] font-bold text-sm flex-1" numberOfLines={2}>{faq.question}</Text>
                </View>
                {expandedFaq === idx ? <ChevronUp size={18} color="#FBB017" /> : <ChevronDown size={18} color="#9CA3AF" />}
              </TouchableOpacity>
              {expandedFaq === idx && (
                <View className="px-5 pb-5 ml-5 border-l-2 border-[#FBB017]/40">
                  <Text className="text-[#2D3A5D]/60 text-sm leading-relaxed">{faq.answer}</Text>
                </View>
              )}
            </View>
          ))}
          {filteredFaqs.length === 0 && (
            <Text className="text-center text-gray-300 font-bold py-10">No results found.</Text>
          )}
        </View>
      </ScrollView>
    </SafeAreaView>
  );
}