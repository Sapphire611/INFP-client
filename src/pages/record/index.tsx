import { View, Text, Button } from "@tarojs/components";
import Taro, { useDidShow } from "@tarojs/taro";
import { useState, useEffect } from "react";
import { AuthStore } from "@shared/store"; // Assuming this exists based on Home page
import { observer } from "mobx-react";
import "./index.scss";

const moodOptions = [
  { value: "happy", label: "开心", icon: "😄" },
  { value: "excited", label: "兴奋", icon: "🤩" },
  { value: "calm", label: "平淡", icon: "🙂" },
  { value: "sad", label: "难过", icon: "😢" },
  { value: "angry", label: "生气", icon: "😠" },
];

const RecordPage = observer(() => {
  const [selectedMood, setSelectedMood] = useState<string | null>(null);
  const [records, setRecords] = useState<any[]>([]);
  const [loading, setLoading] = useState(false);
  const [todayRecord, setTodayRecord] = useState<any>(null);

  const fetchRecords = async () => {
    if (!AuthStore.isLoggedIn) return;

    try {
      setLoading(true);
      const res: any = await Taro.cloud.callFunction({
        name: "mood",
        data: {
          type: "get",
        },
      });

      if (res.result && res.result.success) {
        const today = new Date().toISOString().split("T")[0];
        const todayRec = res.result.data.find((r: any) => r.date === today);
        const otherRecords = res.result.data.filter((r: any) => r.date !== today);

        setTodayRecord(todayRec);
        setRecords(otherRecords);

        if (todayRec) {
          setSelectedMood(todayRec.mood);
        }
      }
    } catch (err) {
      console.error("Failed to fetch records", err);
      Taro.showToast({ title: "加载失败", icon: "none" });
    } finally {
      setLoading(false);
    }
  };

  // 监听登录状态变化
  useEffect(() => {
    if (!AuthStore.isLoggedIn) {
      // 退出登录后清空状态
      setSelectedMood(null);
      setTodayRecord(null);
      setRecords([]);
    } else {
      // 登录后获取记录
      fetchRecords();
    }
  }, [AuthStore.isLoggedIn]);

  useDidShow(() => {
    if (AuthStore.isLoggedIn) {
      fetchRecords();
    }
  });

  const handleSave = async () => {
    if (!AuthStore.isLoggedIn) {
      Taro.showToast({ title: "请先登录", icon: "none" });
      Taro.navigateTo({ url: '/pages/login/index' });
      return;
    }

    if (!selectedMood) {
      Taro.showToast({ title: "请选择今日心情", icon: "none" });
      return;
    }

    // 如果今日已记录，不允许重复提交
    if (todayRecord) {
      Taro.showToast({ title: "今日已记录过心情啦", icon: "none" });
      return;
    }

    const moodObj = moodOptions.find((m) => m.value === selectedMood);
    if (!moodObj) return;

    try {
      Taro.showLoading({ title: "保存中..." });
      const today = new Date().toISOString().split("T")[0];

      console.log('准备保存:', { mood: selectedMood, moodText: moodObj.label, date: today });

      const res: any = await Taro.cloud.callFunction({
        name: "mood",
        data: {
          type: "add",
          data: {
            mood: selectedMood,
            moodText: moodObj.label,
            date: today,
          },
        },
      });

      console.log('云函数返回:', res);

      Taro.hideLoading();

      if (res.result && res.result.success) {
        Taro.showToast({ title: "记录成功", icon: "success" });
        fetchRecords(); // Refresh list
      } else if (res.result && res.result.alreadyExists) {
        Taro.showToast({ title: "今日已记录过心情啦", icon: "none" });
      } else {
        console.error('保存失败:', res);
        Taro.showToast({ title: "保存失败: " + (res.result?.errMsg || "未知错误"), icon: "none" });
      }

    } catch (err) {
      Taro.hideLoading();
      console.error("Save failed", err);
      Taro.showToast({ title: "保存失败，请重试", icon: "none" });
    }
  };

  const handleLogin = () => {
    Taro.navigateTo({ url: '/pages/login/index' });
  };

  const formatDate = (dateStr: string) => {
      // Basic formatting if needed, though YYYY-MM-DD is often fine
      return dateStr;
  }

  return (
    <View className="record-page">
      <View className="record-card">
        <View className="header">
          <Text className="title">今日心情</Text>
          <Text className="subtitle">
            {todayRecord ? "今日已记录" : "记录当下的感受..."}
          </Text>
        </View>

        {!AuthStore.isLoggedIn ? (
          <View className="login-prompt">
            <Text className="login-icon">🔒</Text>
            <Text className="login-text">登录后即可记录每日心情</Text>
            <Button className="login-btn" onClick={handleLogin}>
              去登录
            </Button>
          </View>
        ) : (
          <>
            <View className="mood-selector">
              {moodOptions.map((option) => (
                <View
                  key={option.value}
                  className={`mood-item ${selectedMood === option.value ? "active" : ""}`}
                  onClick={() => !todayRecord && setSelectedMood(option.value)}
                >
                  <Text className="mood-icon">{option.icon}</Text>
                  <Text className="mood-text">{option.label}</Text>
                </View>
              ))}
            </View>

            {!todayRecord && (
              <Button className="save-btn" onClick={handleSave}>
                保存记录
              </Button>
            )}
          </>
        )}
      </View>

      <View className="history-section">
        <Text className="history-title">最近记录</Text>
        <View className="record-list">
          {!AuthStore.isLoggedIn ? (
            <View className="empty-state">
              <Text>请先登录查看历史记录</Text>
            </View>
          ) : records.length > 0 ? (
            records.map((record) => {
                const moodInfo = moodOptions.find(m => m.value === record.mood) || { icon: '❓', label: record.moodText || '未知' };
                return (
                    <View key={record._id} className="record-item">
                        <View className="record-info">
                        <Text className="record-date">{formatDate(record.date)}</Text>
                        </View>
                        <View className="record-mood">
                        <Text className="mood-icon-small">{moodInfo.icon}</Text>
                        <Text className="mood-text-small">{moodInfo.label}</Text>
                        </View>
                    </View>
                )
            })
          ) : (
            <View className="empty-state">
              <Text>暂无历史记录~</Text>
            </View>
          )}
        </View>
      </View>
    </View>
  );
});

export default RecordPage;
