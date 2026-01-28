import { useState, useEffect } from "react";
import Taro from "@tarojs/taro";
import { Tabbar, TabbarItem } from "@nutui/nutui-react-taro";
import { Message, User, Edit } from "@nutui/icons-react-taro";
import "./index.scss";

const CustomTabbar = () => {
  const [active, setActive] = useState(0);

  // 获取当前应该激活的 tab 索引
  const getActiveIndex = () => {
    const pages = Taro.getCurrentPages();
    const currentPage = pages[pages.length - 1];
    const route = currentPage?.route || "";

    if (route.includes("home")) {
      return 0;
    }
    if (route.includes("record")) {
      return 1;
    }
    if (route.includes("profile")) {
      return 2;
    }
    return 0;
  };

  // 更新当前激活的 tab（只在状态真正变化时才更新，避免闪烁）
  const updateActiveTab = () => {
    const newActive = getActiveIndex();
    setActive((prev) => {
      // 只有当状态真正变化时才更新
      if (prev !== newActive) {
        return newActive;
      }
      return prev;
    });
  };

  useEffect(() => {
    // 初始化时更新一次
    updateActiveTab();

    // 使用定时器定期检查路由变化
    const timer = setInterval(() => {
      updateActiveTab();
    }, 200);

    return () => {
      clearInterval(timer);
    };
  }, []);

  const handleSwitch = (value: number) => {
    // 页面路径映射
    const pathMap = [
      "/pages/home/index",
      "/pages/record/index",
      "/pages/profile/index",
    ];

    const targetPath = pathMap[value];
    if (targetPath) {
      // 先立即更新状态，避免延迟感
      setActive(value);

      // 然后进行页面跳转
      Taro.switchTab({
        url: targetPath,
      });
    }
  };

  return (
    <Tabbar
      value={active}
      onSwitch={handleSwitch}
      activeColor="#66bb6a"
      inactiveColor="#9e9e9e"
    >
      <TabbarItem title="聊天" icon={<Message size={20} />} />
      <TabbarItem title="记录" icon={<Edit size={20} />} />
      <TabbarItem title="我的" icon={<User size={20} />} />
    </Tabbar>
  );
};

export default CustomTabbar;