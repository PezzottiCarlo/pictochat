import React from "react";
import { CheckCircleFilled } from "@ant-design/icons";

interface CircularCheckMarkProps { size?: number; color?: string }

export const CirculaCheckMark: React.FC<CircularCheckMarkProps> = ({ size = 64, color = "#52c41a" }) => {
  return <CheckCircleFilled style={{ fontSize: size, color }} />;
};
