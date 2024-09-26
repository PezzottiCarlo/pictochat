import React, { useEffect, useState, useRef, useCallback, useLayoutEffect } from 'react';
import { Layout, Input, Button, List, Skeleton, Popover } from 'antd';
import { BulbFilled, SendOutlined } from '@ant-design/icons';
import { useParams } from 'react-router-dom';
import bigInt from 'big-integer';
import { motion } from 'framer-motion';
import InfiniteScroll from 'react-infinite-scroll-component';


const { Content, Footer } = Layout;

interface ChatProps {
    chatId: bigInt.BigInteger;
}

export const ChatWrapper: React.FC = () => {
    const { chatId } = useParams<{ chatId: string }>();
    return chatId ? <Chat chatId={bigInt(chatId)} /> : null;
};

export const Chat: React.FC<ChatProps> = ({ chatId }) => {
    return (
        <h1>Chat {chatId.toString()}</h1>
    );
};
