import { Button, Card, Col, Statistic, Row, Form, Input, Select, Tabs, Tag, Modal, Table, Space, InputNumber, Spin, Image, Upload, Steps, Divider, message } from 'antd';
import styled from 'styled-components'
import { useState, useEffect, useRef } from "react";
import { invoke } from "@tauri-apps/api/tauri";
// Import XTerm
import "xterm/css/xterm.css";
// Render the component
import { Terminal } from 'xterm';
import {FitAddon} from 'xterm-addon-fit';

const MainDiv = styled.div`
height:100%;
width:100%;
display:flex;
flex-flow: column;
background:white;`

const commands = {
    echo: {
        description: 'Echo a passed string.',
        usage: 'echo <string>',
        fn: (...args) => args.join(' ')
    }
}
const term = new Terminal({
    rendererType: "canvas", //渲染类型
    // rows: 0, //行数
    // convertEol: true, //启用时，光标将设置为下一行的开头
    scrollback: 50, //终端中的回滚量
    disableStdin: false, //是否应禁用输入。
    cursorStyle: "underline", //光标样式
    cursorBlink: true, //光标闪烁
    wraparoundMode: true,
    windowsMode: true, // 根据窗口换行
    theme: {
      foreground: "#ffffff", //字体
      background: "#1a1a1d", //背景色
      cursor: "help", //设置光标
      lineHeight: 16
    }
  });
const fitAddon = new FitAddon();
term.loadAddon(fitAddon);

export function McTerminal({ setIsInit }) {

    const [messageApi, contextHolder] = message.useMessage();
    const [form] = Form.useForm();
    const [terminalInput,setTerminalInput]=useState("");
    useEffect(() => {
        let termDocument = document.getElementById('terminal')
        if (termDocument) {
        term.open(termDocument)
            fitAddon.fit();
        }
        term.focus();
        window.addEventListener('resize', () => {
            fitAddon.fit();
        });
        term.prompt = (_) => {
            term.write("\r\n\x1b[33m$\x1b[0m ");
          };
        term.prompt();
        term.onKey((e)=>{
            const printable =
            !e.domEvent.altKey &&
            !e.domEvent.altGraphKey &&
            !e.domEvent.ctrlKey &&
            !e.domEvent.metaKey;
          if (e.domEvent.code === 13) {
            // this.Send(term, this.curr_line);
            setTerminalInput("")
            term.prompt();
          } else if (e.domEvent.code === 8) {
            // back 删除的情况
            if (this.term._core.buffer.x > 2) {
              if (this.curr_line.length) {
                const data=terminalInput.slice(0, this.curr_line.length - 1);
                setTerminalInput(data);
                term.write("\b \b");
              } else {
              }
            }
          } else if (printable) {
            let value=terminalInput+e.key;
            setTableData(value);
           term.write(e.key);
          }
          term.focus();
          console.log(1, "print", e.key);
        });
        term.onData((key) => {
            // 粘贴的情况
            if (key.length > 1) {
              term.write(key);
              const value=terminalInput+key;
              setTerminalInput(value);
            }
          });
        }, []);
    

    const [tableData, setTableData] = useState([]);
    const [isModalOpen, setIsModalOpen] = useState(false);
    const [modalSelectOptin, setModalSelectOptin] = useState();
    const [modalSelectedValue, setModalSelectedValue] = useState([]);
    const [currentTableItem, setCurrentTableItem] = useState();

    const handleOnEditItem = (item) => {
        setCurrentTableItem(item);
        console.log(item);
        form.setFieldsValue({
            tagName: item.tagName,
            tagValue: item.tagValue,
            appList: item.appList
        });
        setIsModalOpen(true);
    }

    const handleOnDeleteItem = (item) => {
        console.log(item);
        invoke("delete_tag_by_id", { id: item.id }).then((res) => {
            console.log(res);
            const { response_code, response_msg } = JSON.parse(res);
            if (response_code == 0) {
                messageApi.open({
                    type: 'success',
                    content: '删除成功',
                    duration: 2,
                }).then(() => {
                    refresh();
                });
            }
        });
    }
    const showModal = () => {
        setIsModalOpen(true);
    };
    const handleOk = () => {
        setIsModalOpen(false);
    };
    const handleCancel = () => {
        setIsModalOpen(false);
        setCurrentTableItem(undefined);
        form.resetFields();
    };
   
    const refresh = () => {
        invoke("get_tag_list").then(res => {
            const { response_code, response_msg } = JSON.parse(res);
            if (response_code == 0) {
                let data = response_msg.map(item => ({
                    tagName: item.tag_name,
                    tagValue: item.tag_value,
                    appList: item.app_list,
                    id: item.id
                }));
                setTableData(data);
            }
            console.log(res);
        });
    }

    const columns = () => {
        return [
            {
                title: '标签名称',
                dataIndex: 'tagName',
                key: 'tagName',
                render: (text) => <div style={{ minWidth: "80px" }}>{text}</div>,
            },
            {
                title: '标签值',
                dataIndex: 'tagValue',
                key: 'tagValue',
            },
            {
                title: '包含的应用',
                key: 'appList',
                dataIndex: 'appList',
                render: (_, { appList }, rowIndex) => (
                    <>
                        {appList.map((tag, index) => {
                            let color = colors[rowIndex % colors.length];
                            return (
                                <Tag color={color} key={tag} style={{ margin: "3px" }}>
                                    {tag.toUpperCase()}
                                </Tag>
                            );
                        })}
                    </>
                ),
            },
            {
                title: '操作',
                key: 'action',
                render: (item, record, index) => (
                    <Space size="middle" style={{ minWidth: "100px" }}>
                        <a onClick={() => handleOnEditItem(item)}>编辑</a>
                        <a onClick={() => handleOnDeleteItem(item)}>删除</a>
                    </Space>
                ),
            },
        ]
    };
    const onFinish = (values) => {
        if (currentTableItem === undefined) {
            console.log("创建新标签");
            const { tagName, tagValue, appList } = values;
            invoke("crate_tag", { tagName: tagName, tagValue: tagValue, appList: appList }).then(res => {
                const { response_code, response_msg } = JSON.parse(res);
                if (response_code == 0) {
                    setIsModalOpen(false);
                    messageApi.open({
                        type: 'success',
                        content: '添加标签成功',
                        duration: 2,
                    }).then(() => {
                        refresh();

                    });
                }
                console.log(res);
            });
        } else {
            console.log("更新标签");
            const { tagName, tagValue, appList } = values;
            const { id } = currentTableItem;
            invoke("update_tag", { tagName: tagName, tagValue: tagValue, appList: appList, id: id }).then(res => {
                const { response_code, response_msg } = JSON.parse(res);
                if (response_code == 0) {
                    setIsModalOpen(false);
                    messageApi.open({
                        type: 'success',
                        content: '更新标签成功',
                        duration: 2,
                    }).then(() => {
                        refresh();
                    });
                }
                console.log(res);
            });
        }

        console.log('Success:', values);
    };
    const onFinishFailed = (errorInfo) => {
        console.log('Failed:', errorInfo);
    };
    const onData=(data)=>{
        const code = data.charCodeAt(0);
        console.log("sdsa:"+code);
        // If the user hits empty and there is something typed echo it.
        if (code === 13 && terminalInput.length > 0) {
            xtermRef.current.terminal.write(
                "\r\nYou typed: '" +terminalInput + "'\r\n"
            );
            xtermRef.current.terminal.write("echo> ");
            console.log("sds"+terminalInput);
            setTerminalInput("");
            // this.setState({input: ""})
        } else if (code < 32 || code === 127) { // Disable control Keys such as arrow keys
            return;
        } else { // Add general key press characters to the terminal
            xtermRef.current.terminal.write(data);
            // this.setState({input: this.state.input + data})
            setTerminalInput(terminalInput+data);
        }
    }
    return (
        <MainDiv>
            {/* <Terminal
        commands={commands}
        welcomeMessage={'Welcome to the React terminal!'}
        promptLabel={'me@React:~$'}
      /> */}
            dsada
            <div id="terminal"></div>
        </MainDiv>

  
        // </MainDiv>
    );

}