import React, { useEffect, useRef, useState, useCallback } from "react";
// material-ui
import {
  Box,
  Button,
  CircularProgress,
  Grid,
  Paper,
  Stack,
  Typography,
  IconButton,
  FormControl,
  InputBase,
  Tooltip,
} from "@mui/material";

// project import
import { MdOutlineClose, MdSend } from "react-icons/md";
import { BsBoxArrowInLeft } from "react-icons/bs";
import { MdOutlineMinimize, MdMic, MdMicOff } from "react-icons/md";
import { BsBoxArrowInRight } from "react-icons/bs";
import ChatMessages from "./ChatMessages";
import { widgetStyles, widgetReposition, repositionStyles } from "../config";
import { generateNumericId } from "../utils/generateId";
import API from "../api";
import bgCars from "../assets/bgCars.png";

const options = {
  timeZone: Intl.DateTimeFormat().resolvedOptions().timeZone,
  hour12: false,
  hour: "numeric",
  minute: "numeric",
};

let recognition;

const ChatWidget = ({ botReposition }) => {
  const rePosition = botReposition || widgetReposition;
  const LOADING_GIF_HTML_TAG =
    '<img src="https://d3dqyamsdzq0rr.cloudfront.net/sia/images/loading-dots-01-unscreen.gif" style="width:46px">';
  const [responseLoading, setResponseLoading] = useState(false);
  const [isOpen, setIsOpen] = useState(false);
  const [message, setMessage] = useState("");
  const [conversationData, setConversationData] = useState([]);
  const [width, setWidth] = useState(widgetStyles.width);
  const [messageCompHeight, setMessageCompHeight] = useState(
    widgetStyles.messageContainerheight
  );
  const [isMinimized, setIsMinimized] = useState(false);
  const [isToggleWidth, setIsToggleWidth] = useState(false);
  const chatContainerRef = useRef(null);
  const chatMessagesRef = useRef(null);
  const [isListening, setIsListening] = useState(false);

  const useStyles = {
    containerStyle: {
      boxShadow: repositionStyles.boxShadow,
      zIndex: repositionStyles.zIndex,
      bottom: repositionStyles.bottom,
      borderRadius: repositionStyles.borderRadius,
      width: width,
      position: "fixed",
      bgcolor: "grey.50",
      transition: "width 0.5s ease-in-out, height 0.5s ease-in-out",
      overflow: "hidden",
    },
    botIconStyle: {
      zIndex: repositionStyles.zIndex,
      bottom: repositionStyles.bottom,
      position: "fixed",
    },
    messageContainer: {
      height: messageCompHeight,
      width: width,
      transition: "height 0.5s ease-in-out, width 0.5s ease-in-out",
    },
    left: {
      left: repositionStyles.left,
    },
    right: {
      right: repositionStyles.right,
    },
  };

  const classes = useStyles;

  useEffect(() => {
    setConversationData([]);
    if (!sessionStorage.getItem("userBotId")) {
      sessionStorage.setItem(
        "userBotId",
        `test_userBotId_${generateNumericId(4)}`
      );
    }
  }, []);

  function addLoadingIndicator() {
    setResponseLoading(true);
    const d = new Date();
    let newMessage = {
      from: "bot",
      text: LOADING_GIF_HTML_TAG,
      time: d.toLocaleTimeString([], options),
      type: "loading",
    };
    setConversationData((prevState) => [...prevState, newMessage]);
  }

  function removeLoadingIndicator() {
    setResponseLoading(false);
    setConversationData((prevState) => {
      return prevState.filter((message) => message?.type !== "loading");
    });
  }

  const handleMessageInput = (event) => {
    setMessage(event.target.value);
  };

  const handleKeyDown = (event) => {
    if (responseLoading || isListening) return;
    if (event.key === "Enter" && !event.shiftKey) {
      event.preventDefault();
      handleOnsend();
    }
  };

  const handleCloseBot = (e) => {
    e.preventDefault();
    setIsOpen(false);
    setConversationData([]);
    setWidth(widgetStyles.width);
    setIsToggleWidth(false);
    setIsMinimized(false);
    setMessageCompHeight(widgetStyles.messageContainerheight);
    setMessage("");
    setResponseLoading(false);
    sessionStorage.removeItem("conversationId");
    stopSpeechRecognition();
  };

  const handleToggleWidth = () => {
    if (!isToggleWidth) {
      setWidth("67vw");
    } else {
      setWidth(widgetStyles.width);
    }
    setIsToggleWidth((prev) => !prev);
  };

  const handleMinimize = () => {
    if (!isMinimized) {
      setTimeout(() => {
        setIsMinimized(true);
      }, 300);
      setMessageCompHeight(0);
    } else {
      setIsMinimized(false);
      setTimeout(() => {
        setMessageCompHeight(widgetStyles.messageContainerheight);
      }, 100);
    }
  };

  const fetchBotResponse = async (payload) => {
    return new Promise(async (resolve, reject) => {
      try {
        const { data } = await API.post(`/chat`, payload);
        if (data?.success && data?.reply) resolve(data);
        else reject(data);
      } catch (err) {
        console.log(err);
        reject(err);
      }
    });
  };

  const handleGetBotResponse = (payload) => {
    const d = new Date();
    fetchBotResponse(payload)
      .then((res) => {
        removeLoadingIndicator();
        if (res) {
          const newMessage = {
            from: "bot",
            text: res?.reply,
            time: d.toLocaleTimeString([], options),
          };
          setConversationData((prevState) => [...prevState, newMessage]);
          if (res?.data) {
            const allCarsData = Object.values(res.data)
              .filter((val) => typeof val === "object" && val !== null)
              .flatMap((models) =>
                Object.values(models)
                  .filter((cars) => Array.isArray(cars) && cars.length > 0)
                  .flat()
              );

            if (allCarsData.length > 0) {
              const newMessage = {
                from: "bot",
                carsData: allCarsData,
              };
              setConversationData((prev) => [...prev, newMessage]);
            }
          }
        }
      })
      .catch((err) => {
        removeLoadingIndicator();
        const newMessage = {
          from: "bot",
          text: "System ran into issue. Please try again later.",
          time: d.toLocaleTimeString([], options),
        };
        setConversationData((prevState) => [...prevState, newMessage]);
      });
  };

  const handleOnsend = async (input, rest) => {
    let userMessage = input || message;
    if (userMessage?.trim() === "") return;
    const d = new Date();
    const newMessage = {
      from: "user",
      text: userMessage,
      time: d.toLocaleTimeString([], options),
      ...rest,
    };
    setConversationData((prevState) => [...prevState, newMessage]);
    addLoadingIndicator();
    setMessage("");
    const payload = {
      message: userMessage,
      session_id: sessionStorage.getItem("conversationId"),
    };

    handleGetBotResponse(payload);
  };

  const handleBotIconClick = () => {
    setIsOpen(true);
    setConversationData([]);
    if (!sessionStorage.getItem("conversationId")) {
      sessionStorage.setItem(
        "conversationId",
        `test_convId_${generateNumericId(4)}`
      );
    }
    handleOnsend("Hi", { display: "N" });
  };

  const handleGetSelectedCar = useCallback(
    (data) => {
      if (!data?.id || responseLoading) return;
      const d = new Date();
      const newMessage = {
        from: "user",
        text: `<strong>${data?.displayLabel}</strong>`,
        time: d.toLocaleTimeString([], options),
      };
      setConversationData((prevState) => [...prevState, newMessage]);
      addLoadingIndicator();
      const payload = {
        message: `User selected car ${data?.displayLabel} (${data?.id})`,
        carId: data?.id,
        carName: data?.displayLabel,
        session_id: sessionStorage.getItem("conversationId"),
      };
      handleGetBotResponse(payload);
    },
    [responseLoading]
  );

  const startSpeechRecognition = () => {
    if ("SpeechRecognition" in window || "webkitSpeechRecognition" in window) {
      const SpeechRecognition =
        window.SpeechRecognition || window.webkitSpeechRecognition;
      recognition = new SpeechRecognition();

      recognition.lang = "en-US";
      recognition.interimResults = true;

      recognition.onresult = (event) => {
        const transcript =
          event.results[event.results.length - 1][0].transcript;
        setMessage(transcript);
      };

      recognition.onend = () => {
        setIsListening(false);
      };

      recognition.onerror = (event) => {
        console.error("Error in speech recognition:", event.error);
        setIsListening(false);
      };

      recognition.start();
      setIsListening(true);
    } else {
      console.log("Speech recognition is not supported in this browser");
      setIsListening(false);
    }
  };

  const stopSpeechRecognition = () => {
    if (recognition) {
      recognition.stop();
      setIsListening(false);
    }
  };

  // --- Bot Icon Floating Button ---
  if (!isOpen) {
    return (
      <Box sx={[classes.botIconStyle, classes[rePosition]]}>
        <IconButton
          onClick={handleBotIconClick}
          sx={{
            width: 64,
            height: 64,
            borderRadius: "50%",
            bgcolor: "#000",
            boxShadow: "0 4px 10px rgba(0,0,0,0.3)",
            "&:hover": { bgcolor: "#333" },
          }}
        >
          <img
            src="https://cdn-icons-png.flaticon.com/512/4712/4712109.png"
            alt="bot"
            width="36"
            height="36"
          />
        </IconButton>
      </Box>
    );
  }

  return (
    <Box
      sx={[classes.containerStyle, classes[rePosition]]}
      ref={chatContainerRef}
    >
      <Grid>
        <Grid xs={12}>
          <Grid
            item
            xs={12}
            sx={{
              bgcolor: "#000000",
              borderTopLeftRadius: "10px",
              borderTopRightRadius: "10px",
              padding: "4px 0px 4px 16px",
            }}
          >
            <Grid container justifyContent="space-between" alignItems="center">
              {/* Header Title*/}
              <Grid item>
                <Stack
                  direction="row"
                  alignItems="center"
                  spacing={1}
                  sx={{ position: "relative" }}
                >
                  <Stack direction={"row"} gap={"1rem"} alignItems={"center"}>
                    <Box
                      sx={{
                        display: "flex",
                        alignItems: "center",
                        width: "120px",
                        maxWidth: "120px",
                        height: "40px",
                        maxHeight: "40px",
                      }}
                    >
                      {/* <Typography
                          sx={{
                            color: "#ffffff",
                            "& .beta-btn-base-css:hover": {
                              cursor: "pointer",
                            },
                          }}
                          dangerouslySetInnerHTML={{ __html: "Joulez" }}
                        /> */}
                      <img
                        src="https://drivejoulez.com/static/media/joulezIcon.1de6f93b79eb38f16d5582829aea0aba.svg"
                        alt="joulez"
                        style={{ width: "inherit", height: "inherit" }}
                      />
                    </Box>
                  </Stack>
                </Stack>
              </Grid>

              {/* Header Buttons*/}
              <Grid item paddingRight="10px">
                <Stack
                  direction="row"
                  alignItems="center"
                  justifyContent="flex-end"
                  spacing={1}
                >
                  {/* <IconButton
                      sx={{
                        padding: "0px",
                        marginLeft: "0px !important",
                        width: "22px !important",
                        outline: "none",
                        "&.Mui-focusVisible": {
                          outline: "none",
                        },
                        // fallback for browsers
                        "&:focus": {
                          outline: "none",
                        },
                      }}
                    
                    >
                      <GoKebabHorizontal
                        style={{
                          width: "30px",
                          height: "30px",
                          transform: "rotate(270deg)",
                          strokeWidth: "inherit",
                          color: "#ffffff",
                        }}
                      />
                    </IconButton> */}

                  <IconButton
                    title={!isMinimized ? "Minimize" : "Maximize"}
                    sx={{
                      padding: "2px",
                      marginLeft: "0px !important",
                      "&.Mui-focusVisible": {
                        outline: "none",
                      },
                      "&:focus": {
                        outline: "none",
                      },
                    }}
                    onClick={handleMinimize}
                  >
                    <MdOutlineMinimize
                      style={{
                        width: "30px",
                        height: "28px",
                        color: "#ffffff",
                        marginBottom: "1rem",
                      }}
                    />
                  </IconButton>

                  <IconButton
                    title={!isToggleWidth ? "Wide screen" : "Normal Screen"}
                    sx={{
                      padding: "2px",
                      marginLeft: "0px !important",
                      "&.Mui-focusVisible": {
                        outline: "none",
                      },
                      "&:focus": {
                        outline: "none",
                      },
                    }}
                    onClick={handleToggleWidth}
                  >
                    {width === widgetStyles.width ? (
                      <BsBoxArrowInLeft
                        style={{
                          width: "28px",
                          height: "24px",
                          color: "#ffffff",
                          transform:
                            rePosition === "right"
                              ? "rotate(0deg)"
                              : "rotate(180deg)",
                        }}
                      />
                    ) : (
                      <BsBoxArrowInRight
                        style={{
                          width: "28px",
                          height: "24px",
                          color: "#ffffff",
                          transform:
                            rePosition === "right"
                              ? "rotate(0deg)"
                              : "rotate(180deg)",
                        }}
                      />
                    )}
                  </IconButton>

                  <IconButton
                    title="Close"
                    sx={{
                      padding: "2px",
                      marginLeft: "0px !important",
                      "&.Mui-focusVisible": {
                        outline: "none",
                      },
                      "&:focus": {
                        outline: "none",
                      },
                    }}
                    onClick={handleCloseBot}
                  >
                    <MdOutlineClose
                      style={{
                        width: "28px",
                        height: "24px",
                        color: "#ffffff",
                      }}
                    />
                  </IconButton>
                </Stack>
              </Grid>
            </Grid>
          </Grid>

          <Grid
            sx={{
              height: messageCompHeight,
              display: "flex",
              transition: "height 0.5s ease, width 0.5s ease",
              background: `linear-gradient(rgb(255 255 255 / 73%), rgba(255, 255, 255, .5)), url(${bgCars})`,
              backgroundRepeat: "round",
            }}
            ref={chatMessagesRef}
            container
            paddingLeft="20px"
          >
            <Grid
              item
              xs={12}
              sx={{
                height: `calc(${widgetStyles.messageContainerheight} - 80px)`,
              }}
              paddingTop="0px !important"
            >
              <ChatMessages
                data={conversationData}
                isToggledWidth={isToggleWidth}
                getSelectedCar={handleGetSelectedCar}
              />
            </Grid>

            <Grid
              item
              sx={{
                paddingTop: "0 !important",
                width: "100%",
                display: "flex",
                flexDirection: "column",
                alignItems: "flex-left",
                rowGap: "10px",
                marginBottom: "1rem",
                position: "relative",
              }}
            >
              <Paper
                sx={{
                  display: "flex",
                  alignItems: "center",
                  borderRadius: "22px",
                  p: 1,
                  backgroundColor: "#F4F5F7",
                  border: "1px solid #ECE5DD",
                  mr: 2,
                  position: "relative",
                }}
              >
                <Box
                  sx={{
                    width: "100%",
                    display: "flex",
                    alignItems: "center",
                    justifyContent: "end",
                  }}
                >
                  <FormControl fullWidth>
                    <InputBase
                      fullWidth
                      minRows={1}
                      maxRows={2}
                      multiline
                      disabled={isListening}
                      onChange={handleMessageInput}
                      onKeyDown={handleKeyDown}
                      value={message}
                      placeholder="Type a message"
                    />
                  </FormControl>
                  <IconButton
                    title={isListening ? "Stop speech" : "Start speech"}
                    sx={{
                      color: "#725ce1",
                      position: "relative",
                      "&.Mui-focusVisible": { outline: "none" },
                      "&:focus": { outline: "none" },
                      "&:hover": {
                        backgroundColor: "#725ce126",
                      },
                      overflow: "hidden",
                      backgroundColor: isListening
                        ? "rgba(25, 118, 210, 0.1)"
                        : "transparent",
                      transition: "background-color 0.3s ease",
                      ...(isListening && {
                        "&::before": {
                          content: '""',
                          position: "absolute",
                          inset: 0,
                          borderRadius: "50%",
                          background:
                            "radial-gradient(circle, rgba(25,118,210,0.4) 0%, rgba(25,118,210,0) 70%)",
                          animation: "waveGlow 0.9s infinite ease-in-out",
                        },
                        "@keyframes waveGlow": {
                          "0%": { transform: "scale(1)", opacity: 0.8 },
                          "50%": { transform: "scale(1.5)", opacity: 0.4 },
                          "100%": { transform: "scale(1)", opacity: 0.8 },
                        },
                      }),
                    }}
                    disabled={responseLoading}
                    onClick={() =>
                      isListening
                        ? stopSpeechRecognition()
                        : startSpeechRecognition()
                    }
                  >
                    {!isListening ? <MdMicOff /> : <MdMic />}
                  </IconButton>
                  <IconButton
                    disabled={responseLoading || !message?.length}
                    sx={{
                      color: "#725ce1",
                      "&:hover": {
                        backgroundColor: "#725ce126",
                      },
                      "&.Mui-focusVisible": { outline: "none" },
                      "&:focus": { outline: "none" },
                    }}
                    onClick={() => handleOnsend()}
                  >
                    <MdSend />
                  </IconButton>
                </Box>
              </Paper>
            </Grid>
          </Grid>
        </Grid>
      </Grid>
    </Box>
  );
};

export default ChatWidget;
