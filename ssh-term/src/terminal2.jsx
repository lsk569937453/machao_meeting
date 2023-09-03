 
//引入
import { memo, useEffect, useRef } from "react";
import { Terminal } from "xterm"
import { ITerminalOptions, ITerminalInitOnlyOptions } from "xterm"
import "xterm/css/xterm.css"
import React from "react";
 
import { FitAddon } from 'xterm-addon-fit';
 
const Xterminal = ({ dispatch }, onKey, props) => {
   //dispatch按需，不用可以不加
  const fitPlugin = new FitAddon();
  
  const terminalRef = useRef(null)
  const options = { ...ITerminalOptions, ...ITerminalInitOnlyOptions }
  let count = 0
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
    scrollback: 10,
    options,
    theme: {
      foreground: "#ffffff", //字体
      background: "#1a1a1d", //背景色
      cursor: "help", //设置光标
      lineHeight: 16
    }
  });
    //自定义终端首段提示
  let terminalTitleTemplate = "[root@server]\x1B[0m $ "
  // 换行并输入起始符 $
  term.prompt = () => {
    term.write(`\r\n${terminalTitleTemplate}`)
  }
 
  const keyAction = () => {
    // 定义变量获取整行数据
    let currentLineData = ''
    // 历史行输入数据
    let historyLineData = []
    let last = 0
    // 使其能够输入汉字
    term.onData(async key => {
      //enter键
      if (key.charCodeAt(0) === 13) {
        // 将行数据进行添加进去
        if (currentLineData !== '') {
          //将当前行数据传入历史命令数组中存储
          historyLineData.push(currentLineData)
          //定义当前行命令在整个数组中的位置
          last = historyLineData.length - 1
        }
        //当输入clear时清空终端内容
        if (currentLineData === 'clear') {
          term.clear()
        }
 
        //在这可以进行发起请求将整行数据传入
        runJob(currentLineData)
        // 清空当前行数据
        currentLineData = ''
 
      }  else if (key.charCodeAt(0) === 127) {
        //删除键--》当前行偏移量x大于终端提示符所占位置时进行删除
        // console.log(term._core.buffer.x,"term._core.buffer.x")
        //这里我设置的是17个占位，你可以根据自己的需求酌情增减
        if (term._core.buffer.x >17) {
          currentLineData = currentLineData.slice(0, -1)
          term.write('\b \b')
        }
      } else if (key === '\u001b[A') {
        //up键的时候
        let len = 0
        if (historyLineData.length > 0) {
          len = historyLineData.length + 1
        }
 
        if (last < len && last > 0) {
          //当前行有数据的时候进行删除掉在进行渲染上存储的历史数据
          for (let i = 0; i < currentLineData.length; i++) {
            if (term._core.buffer.x > terminalTitleTemplate.length + 1) {
              term.write('\b \b')
            }
          }
          let text = historyLineData[last - 1]
          term.write(text)
          //重点，一定要记住存储当前行命令保证下次up或down时不会光标错乱覆盖终端提示符
          currentLineData = text
 
          last--
        }
      } else if (key === '\u001b[B') {
        //down键
        let lent = 0
        if (historyLineData.length > 0) {
          lent = historyLineData.length - 1
        }
        if (last < lent && last > -1) {
          for (let i = 0; i < currentLineData.length; i++) {
            if (term._core.buffer.x > terminalTitleTemplate.length + 1) {
              term.write('\b \b')
            }
          }
          let text = historyLineData[last + 1]
          term.write(text)
          currentLineData = text
          last++
        }
      } else {
        //啥也不做的时候就直接输入
        currentLineData += key
        term.write(key)
      }
    })
  }
  useEffect(() => {
    keyAction()
    // 打开一个已经初始化好的的终端
    // term.open(terminalRef.current);
    // 向终端中写入数据
    term.open(terminalRef.current);
   
    if (term._initialized) {
      return
    }
    term._initialized = true
    if (count == 0) {
        term.write("ssssa");
        term.write(`\r\n`);
        term.writeln(terminalTitleTemplate);
        //这里是需求是默认加载一段后端返回的信息
    //   dispatch({
    //     type: 'task/queryTask',
    //     callback: (res) => {
    //       res.data.taskList.forEach(t => {
    //         term.writeln(t)
    //       });
    //       term.write(terminalTitleTemplate)
    //     }
    //   })
    }
    //光标聚焦
    term.focus();
    term.loadAddon(fitPlugin);
    fitPlugin.fit();
    //自适应窗口
    window.onresize = () => fitPlugin.fit()
    count++
 
    return () => {
      term.dispose()
    }
  }, [count])
 
  
 
  const runJob = (param) => {
    {
        term.write(`\r\n`)
        term.writeln(param);
        term.write(`\r\n${terminalTitleTemplate} `);
        term.focus();

        // dispatch({
        //   type: 'task/terminalOperation',
        //   payload: { param: param },
        //   callback: (res) => {
        //     console.log(res.data, "res") 
        //     term.write(`\r\n`)
        //     if(res.data.taskListStr!=""){
        //       res.data.taskListStr.forEach(t => {
        //         term.writeln(t)
        //       });
        //     }else{
        //       term.writeln(res.data.errorData)
        //     }
        //     // 添加输出（为空也要输出换行）
        //     term.write(`\r\n${terminalTitleTemplate} `)
        //     term.focus();
        //   }
        // })
    }
  }
  return (
    <div className="terminal-container">
//样式可以自行调整
      <div style={{height:'100%',overflow:'scroll'}} ref={terminalRef}></div>
    </div>
  )
}
 
export default memo(Xterminal)