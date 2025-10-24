import { useCallback, useEffect, useRef, useState, memo, useMemo } from "react";
import DisplayCarsData from "./DisplayCarsData";
import { FaUserLarge } from "react-icons/fa6";
import { FaArrowDown } from "react-icons/fa6";

// material-ui
import {
  Button,
  Card,
  CardContent,
  Grid,
  Stack,
  TextField,
  Tooltip,
  Typography,
  Box,
  IconButton,
  Fade,
} from "@mui/material";
import { widgetStyles } from "../config";

const ChatMessages = ({
  data,
  isToggledWidth,
  getSelectedCar,
  getSelectedSuggestion,
}) => {
  // scroll to bottom when new message is sent or received
  const containerRef = useRef(null);
  const [showScrollButton, setShowScrollButton] = useState(false);

  const userBoxStyle = useMemo(
    () => ({
      display: "flex",
      flexDirection: "column",
      width: "auto",
      maxWidth: isToggledWidth ? "90%" : "70%",
      display: "flex",
    }),
    [isToggledWidth]
  );

  const botBoxStyle = useMemo(
    () => ({
      flexDirection: "column",
      display: "flex",
      width: "100%",
      maxWidth: isToggledWidth ? "90%" : "70%",
    }),
    [isToggledWidth]
  );

  useEffect(() => {
    if (containerRef.current) {
      containerRef.current.scrollTo({
        top: containerRef.current.scrollHeight,
        behavior: "smooth",
      });
    }
  }, [data]);

  // const handleScroll = useCallback(() => {
  //   const el = containerRef.current;
  //   if (!el) return;

  //   const isNearBottom = el.scrollHeight - el.scrollTop - el.clientHeight < 80;
  //   setShowScrollButton(!isNearBottom);
  // }, []);

  // useEffect(() => {
  //   const el = containerRef.current;
  //   if (!el) return;
  //   el.addEventListener("scroll", handleScroll);
  //   return () => el.removeEventListener("scroll", handleScroll);
  // }, [handleScroll]);

  // scroll to bottom on button click
  // const scrollToBottom = () => {
  //   const el = containerRef.current;
  //   if (el) {
  //     el.scrollTo({
  //       top: el.scrollHeight,
  //       behavior: "smooth",
  //     });
  //   }
  // };

  const handleShowButtons = (history, i) => {
    return (
      <Grid item xs={12} paddingBottom="14px" key={i}>
        <Stack direction="column" spacing={1}>
          {history?.suggestions?.length > 0 &&
            history.suggestions.map((suggestion, index) => (
              <Button
                variant="contained"
                color="primary"
                onClick={() => getSelectedSuggestion(suggestion)}
                sx={{
                  backgroundColor: "#F7F6F5",
                  minWidth: "100%",
                  maxWidth: isToggledWidth ? "90%" : "70%",
                  border: "1px solid",
                  borderRadius: "20px",
                  color: "#000000",
                  "&:hover": {
                    backgroundColor: "#725ce1",
                    color: "#ffffff",
                  },
                  textTransform: "none",
                  "&:focus": {
                    outline: "none",
                  },
                }}
              >
                {suggestion}
              </Button>
            ))}
        </Stack>
      </Grid>
    );
  };

  const userMessages = (history, i) => {
    return (
      <Stack
        key={i}
        paddingTop="10px"
        paddingRight="12px"
        sx={{
          width: "100%",
          flexDirection: "row",
          alignItems: "flex-start",
          justifyContent: "flex-end",
          columnGap: "5px",
          display: history?.display != "N" ? "flex" : "none",
        }}
      >
        <Box sx={userBoxStyle}>
          <Box
            sx={{
              // bgcolor: "#8080806e",
              bgcolor: "#725ce1",
              p: 2,
              borderRadius: "20px 0 20px 20px",
              textAlign: "left",
            }}
          >
            <Typography
              fontSize="1rem"
              color="#ffffff"
              sx={{ wordWrap: "break-word", wordBreak: "break-word" }}
              dangerouslySetInnerHTML={{ __html: history?.text }}
            ></Typography>
          </Box>

          <Typography align="right" variant="subtitle2" color="textSecondary">
            {history.time}
          </Typography>
        </Box>
        <Box>
          <FaUserLarge
            style={{
              borderRadius: "50px",
              border: "1px solid gray",
              padding: "2px",
              width: "26px",
              height: "26px",
              color: "#00000080",
            }}
          />
        </Box>
      </Stack>
    );
  };

  const botMessages = (history, i) => {
    return (
      <Stack
        key={i}
        direction="row"
        spacing={1.25}
        alignItems="flext-start"
        justifyContent={"start"}
        mb={history?.type === "loading" ? "1rem" : "0"}
      >
        <Box sx={{ display: "flex", alignItems: "start" }}>
          <img
            src="https://cdn-icons-png.flaticon.com/512/4712/4712109.png"
            alt="bot"
            style={{
              borderRadius: "50px",
              border: "1px solid gray",
              padding: "2px",
              width: "26px",
              height: "26px",
            }}
          />
        </Box>

        {history?.type === "loading" ? (
          <Typography
            fontSize="1rem"
            color="textPrimary"
            dangerouslySetInnerHTML={{ __html: history?.text }}
          ></Typography>
        ) : (
          <Box sx={botBoxStyle}>
            <Box
              sx={{
                // bgcolor: "#80808014",
                bgcolor: "#26252329",
                p: 2,
                borderRadius: "0 20px 20px 20px",
                textAlign: "left",
              }}
            >
              <Typography
                fontSize="1rem"
                color="textPrimary"
                sx={{ wordWrap: "break-word", wordBreak: "break-word" }}
                dangerouslySetInnerHTML={{ __html: history?.text }}
              ></Typography>
            </Box>

            <Typography align="left" variant="subtitle2" color="textSecondary">
              {history?.time}
            </Typography>
            {i === data?.length - 1 && handleShowButtons(history, i)}
          </Box>
        )}
      </Stack>
    );
  };

  return (
    <Grid
      container
      spacing={2.5}
      ref={containerRef}
      overflow={"auto"}
      pt={2}
      maxHeight={`calc(${widgetStyles.messageContainerheight} - 80px)`}
      sx={{
        overflowX: "hidden",
        "::-webkit-scrollbar": {
          width: "4px",
        },
        "::-webkit-scrollbar-track": {
          background: "#f1f1f1",
        },
        "::-webkit-scrollbar-thumb": {
          background: "#888",
          borderRadius: "50px",
        },
      }}
    >
      {data?.map((history, i) => {
        return history?.from !== "bot" ? (
          userMessages(history, i)
        ) : history?.carsData ? (
          <DisplayCarsData
            getSelectedCar={getSelectedCar}
            cars={history?.carsData}
            index={i}
            isToggledWidth={isToggledWidth}
          />
        ) : (
          botMessages(history, i)
        );
      })}

      {/* Floating Scroll-to-bottom Button */}
      {/* <Fade in={showScrollButton}>
        <IconButton
          onClick={scrollToBottom}
          sx={{
            position: "absolute",
            bottom: 100,
            left: "50%",
            transform: "translateX(-50%)",
            backgroundColor: "#1976d2",
            color: "#fff",
            "&:hover": {
              backgroundColor: "#125aa7",
            },
          }}
        >
          <FaArrowDown />
        </IconButton>
      </Fade> */}
    </Grid>
  );
};

export default memo(ChatMessages);
