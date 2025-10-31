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
  useTheme,
  useMediaQuery,
} from "@mui/material";

// project import
import { MdOutlineClose, MdSend, MdStop } from "react-icons/md";
import { BsBoxArrowInLeft } from "react-icons/bs";
import {
  MdOutlineMinimize,
  MdMic,
  MdMicOff,
  MdOutlineZoomOutMap,
  MdOutlineZoomInMap,
} from "react-icons/md";
import { BsBoxArrowInRight } from "react-icons/bs";
import ChatMessages from "./ChatMessages";
import { widgetStyles, widgetReposition, repositionStyles } from "../config";
import { generateNumericId } from "../utils/generateId";
import API from "../api";
import bgCars from "../assets/bgCars.png";
import Waveform from "./Waveform";

const options = {
  timeZone: Intl.DateTimeFormat().resolvedOptions().timeZone,
  hour12: false,
  hour: "numeric",
  minute: "numeric",
};

let recognition;
let isRecognitionActive = false;

const ChatWidget = ({ botReposition }) => {
  const rePosition = botReposition || widgetReposition;
  const theme = useTheme();
  const isLargeScreen = useMediaQuery(theme.breakpoints.up("sm"));

  const LOADING_GIF_HTML_TAG =
    '<img src="https://d3dqyamsdzq0rr.cloudfront.net/sia/images/loading-dots-01-unscreen.gif" style="width:46px">';
  const [responseLoading, setResponseLoading] = useState(false);
  const [isOpen, setIsOpen] = useState(false);
  const [message, setMessage] = useState("");
  const [transcriptMsg, setTranscriptMsg] = useState("");
  const [isTranscribing, setIsTranscribing] = useState(false);
  const [conversationData, setConversationData] = useState([]);
  const [width, setWidth] = useState(
    isLargeScreen ? widgetStyles.width : "350px"
  );
  const [messageCompHeight, setMessageCompHeight] = useState(
    widgetStyles.messageContainerheight
  );
  const [isMinimized, setIsMinimized] = useState(false);
  const [isToggleWidth, setIsToggleWidth] = useState(false);
  const chatContainerRef = useRef(null);
  const chatMessagesRef = useRef(null);
  const [isListening, setIsListening] = useState(false);
  const isListeningRef = useRef(false);
  const inputRef = useRef(null);

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
    setWidth(isLargeScreen ? widgetStyles.width : "350px");
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
          if (res?.suggestions?.length > 0) {
            newMessage["suggestions"] = res.suggestions;
          }
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

  const handleGetSelectedSuggestion = useCallback(
    (input) => {
      if (!input || responseLoading) return;
      const d = new Date();
      const newMessage = {
        from: "user",
        text: input,
        time: d.toLocaleTimeString([], options),
      };
      setConversationData((prevState) => [...prevState, newMessage]);
      addLoadingIndicator();
      const payload = {
        message: input,
        session_id: sessionStorage.getItem("conversationId"),
      };
      handleGetBotResponse(payload);
    },
    [responseLoading]
  );

  useEffect(() => {
    isListeningRef.current = isListening;
    if (!isListening) {
      const timer = setTimeout(() => {
        if (inputRef.current) {
          inputRef.current.focus();
          const el = inputRef.current;
          const length = el.value.length;
          el.setSelectionRange(length, length);
        }
      }, 100);

      return () => clearTimeout(timer);
    }
  }, [isListening]);

  const startSpeechRecognition = () => {
    if ("SpeechRecognition" in window || "webkitSpeechRecognition" in window) {
      const SpeechRecognition =
        window.SpeechRecognition || window.webkitSpeechRecognition;
      if (!recognition) {
        recognition = new SpeechRecognition();
        recognition.lang = "en-US";
        recognition.interimResults = true;
        recognition.continuous = true;
      }

      recognition.onstart = () => {
        isRecognitionActive = true;
        console.log("Recognition started");
      };

      recognition.onresult = (event) => {
        let fullTranscript = "";
        for (let i = 0; i < event.results.length; i++) {
          fullTranscript += event.results[i][0].transcript;
        }
        setTranscriptMsg(fullTranscript?.trim());
      };

      recognition.onend = () => {
        console.log("Recognition ended");
        isRecognitionActive = false;
        if (isListeningRef.current) {
          setTimeout(() => {
            if (!isRecognitionActive) recognition.start();
          }, 300);
        } else {
          setIsListening(false);
        }
      };

      recognition.onerror = (event) => {
        console.error("Error in speech recognition:", event.error);
        isRecognitionActive = false;
        if (
          (event.error === "no-speech" || event.error === "network") &&
          isListeningRef.current
        ) {
          console.log("isListenging", isListeningRef.current);
          setTimeout(() => {
            if (!isRecognitionActive) recognition.start();
          }, 500);
        } else {
          setIsListening(false);
        }
      };

      if (!isRecognitionActive && !isListening) {
        recognition.start();
        setIsListening(true);
      }
    } else {
      console.log("Speech recognition is not supported in this browser");
      setIsListening(false);
    }
  };

  const stopSpeechRecognition = () => {
    if (recognition && isRecognitionActive) {
      recognition.stop();
      isRecognitionActive = false;
      setIsListening(false);
      setTranscriptMsg("");
      setIsTranscribing(false);
    }
  };

  const transcribeVoiceMsg = async () => {
    setIsTranscribing(true);
    const simulateDelay = (ms) => new Promise((r) => setTimeout(r, ms));
    await simulateDelay(1000);
    if(isListening) setMessage(transcriptMsg);
    stopSpeechRecognition();
  };

  // --- Bot Icon Floating Button ---
  if (!isOpen) {
    return (
      <Box sx={[classes.botIconStyle, classes[rePosition]]}>
        <IconButton
          onClick={handleBotIconClick}
          sx={{
            width: 50,
            height: 50,
            borderRadius: "50%",
            bgcolor: "rgb(114, 92, 225)",
            boxShadow: "0 0 7px 2px rgba(0,0,0,0.3)",
            "&:hover": {
              opacity: 1,
              transition: "transform 0.16s linear, opacity 0.08s",
              transform: "scale(1.1)",
              bgcolor: "rgb(114, 92, 225)",
            },
            "&:focus": {
              outline: "none",
            },
          }}
        >
          {/* <img
            src="https://cdn-icons-png.flaticon.com/512/4712/4712109.png"
            alt="bot"
            width="36"
            height="36"
          /> */}
          <svg
            focusable="false"
            aria-hidden="true"
            fill="#ffffff"
            viewBox="0 0 28 32"
            width="24"
            height="26"
          >
            <path d="M28,32 C28,32 23.2863266,30.1450667 19.4727818,28.6592 L3.43749107,28.6592 C1.53921989,28.6592 0,27.0272 0,25.0144 L0,3.6448 C0,1.632 1.53921989,0 3.43749107,0 L24.5615088,0 C26.45978,0 27.9989999,1.632 27.9989999,3.6448 L27.9989999,22.0490667 L28,22.0490667 L28,32 Z M23.8614088,20.0181333 C23.5309223,19.6105242 22.9540812,19.5633836 22.5692242,19.9125333 C22.5392199,19.9392 19.5537934,22.5941333 13.9989999,22.5941333 C8.51321617,22.5941333 5.48178311,19.9584 5.4277754,19.9104 C5.04295119,19.5629428 4.46760991,19.6105095 4.13759108,20.0170667 C3.97913051,20.2124916 3.9004494,20.4673395 3.91904357,20.7249415 C3.93763774,20.9825435 4.05196575,21.2215447 4.23660523,21.3888 C4.37862552,21.5168 7.77411059,24.5386667 13.9989999,24.5386667 C20.2248893,24.5386667 23.6203743,21.5168 23.7623946,21.3888 C23.9467342,21.2215726 24.0608642,20.9827905 24.0794539,20.7254507 C24.0980436,20.4681109 24.0195551,20.2135019 23.8614088,20.0181333 Z"></path>
          </svg>
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

                  {isLargeScreen && (
                    <IconButton
                      title={
                        !isToggleWidth ? "Expand screen" : "Collapse screen"
                      }
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
                        <MdOutlineZoomOutMap
                          style={{
                            width: "28px",
                            height: "24px",
                            color: "#ffffff",
                            // transform:
                            //   rePosition === "right"
                            //     ? "rotate(0deg)"
                            //     : "rotate(180deg)",
                          }}
                        />
                      ) : (
                        <MdOutlineZoomInMap
                          style={{
                            width: "28px",
                            height: "24px",
                            color: "#ffffff",
                            // transform:
                            //   rePosition === "right"
                            //     ? "rotate(0deg)"
                            //     : "rotate(180deg)",
                          }}
                        />
                      )}
                    </IconButton>
                  )}

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
                getSelectedSuggestion={handleGetSelectedSuggestion}
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
                  p: isListening ? 0.5 : 1,
                  backgroundColor: "#F4F5F7",
                  border: "1px solid #ECE5DD",
                  mr: 2,
                  position: "relative",
                }}
              >
                {!isListening ? (
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
                        inputRef={inputRef}
                        placeholder="Type a message"
                      />
                    </FormControl>
                    {!message?.trim()?.length && (
                      <IconButton
                        title={"Start speech"}
                        sx={{
                          color: "#725ce1",
                          position: "relative",
                          "&.Mui-focusVisible": { outline: "none" },
                          "&:focus": { outline: "none" },
                          "&:hover": {
                            backgroundColor: "#725ce126",
                          },
                          overflow: "hidden",
                          backgroundColor: "transparent",
                          transition: "background-color 0.3s ease",
                        }}
                        disabled={responseLoading}
                        onClick={() => startSpeechRecognition()}
                      >
                        <MdMic />
                      </IconButton>
                    )}

                    <IconButton
                      disabled={responseLoading || !message?.trim()?.length}
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
                ) : (
                  <Stack direction={"row"} alignItems={"center"} width="100%">
                    <Button
                      title="Cancel"
                      sx={{
                        height: "30px",
                        width: "20px",
                        minWidth: "32px",
                        padding: "2px",
                        "&.Mui-focusVisible": {
                          outline: "none",
                        },
                        "&:focus": {
                          outline: "none",
                        },
                        "&:hover": {
                          transform: "scale(1.01)",
                        },
                      }}
                      onClick={stopSpeechRecognition}
                    >
                      <MdOutlineClose
                        style={{
                          width: "28px",
                          height: "24px",
                          color: "#ffffff",
                          background: "gray",
                          padding: "2px",
                          borderRadius: "30px",
                        }}
                      />
                    </Button>
                    <Box mx={"6px"} width="90%">
                      {isTranscribing ? (
                        <Box
                          sx={{
                            display: "flex",
                            justifyContent: "center",
                            alignItems: "center",
                            height: "44px",
                            gap: "8px",
                          }}
                        >
                          <CircularProgress
                            enableTrackSlot
                            thickness={5}
                            sx={{
                              color: "#725ce1",
                              "& .MuiCircularProgress-circle": {
                                strokeDasharray: "40 80",
                              },
                            }}
                            size={16}
                          />
                          <Typography fontSize={"14px"}>
                            Transcribing...
                          </Typography>
                        </Box>
                      ) : (
                        <Waveform isListening={isListening} />
                      )}
                    </Box>
                    <Button
                      title="Stop"
                      sx={{
                        height: "30px",
                        width: "20px",
                        minWidth: "32px",
                        padding: "2px",
                        "&.Mui-focusVisible": {
                          outline: "none",
                        },
                        "&:focus": {
                          outline: "none",
                        },
                        "&:hover": {
                          transform: "scale(1.01)",
                        },
                      }}
                      onClick={transcribeVoiceMsg}
                      disabled={isTranscribing}
                    >
                      <MdStop
                        style={{
                          width: "28px",
                          height: "24px",
                          color: "#ffffff",
                          background: isTranscribing ? "#80808047" : "red",
                          padding: "2px",
                          borderRadius: "30px",
                        }}
                      />
                    </Button>
                  </Stack>
                )}
              </Paper>
            </Grid>
          </Grid>
        </Grid>
      </Grid>
    </Box>
  );
};

export default ChatWidget;
