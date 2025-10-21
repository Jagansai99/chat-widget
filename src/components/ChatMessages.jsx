import { useCallback, useEffect, useRef, useState } from "react";
import DisplayCarsData from "./DisplayCarsData";
import { FaUserLarge } from "react-icons/fa6";


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
} from "@mui/material";
import { widgetStyles } from "../config";

const ChatMessages = ({ data, isToggledWidth, getSelectedCar }) => {
  // scroll to bottom when new message is sent or received
  const containerRef = useRef(null);

  useEffect(() => {
    if (containerRef.current) {
      containerRef.current.scrollTo({
        top: containerRef.current.scrollHeight,
        behavior: "smooth",
      });
    }
  }, [data]);

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
        <Box
          sx={{
            display: "flex",
            flexDirection: "column",
            width: "auto",
            maxWidth: isToggledWidth ? "80%" : "70%",
            display: "flex",
          }}
        >
          <Box
            sx={{
              bgcolor: "#8080806e",
              p: 2,
              borderRadius: "12px",
              textAlign: "left",
            }}
          >
            <Typography
              fontSize="1rem"
              color="textPrimary"
              dangerouslySetInnerHTML={{ __html: history?.text }}
            ></Typography>
          </Box>

          <Typography align="right" variant="subtitle2" color="textSecondary">
            {history.time}
          </Typography>
        </Box>
        <Box>
          <FaUserLarge   style={{
              borderRadius: "50px",
              border: "1px solid gray",
              padding: "2px",
              width: "30px",
              height: "30px",
              color:"#000000"
            }}/>
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
      >
        <Box sx={{ display: "flex", alignItems: "start" }}>
          <img
            src="https://cdn-icons-png.flaticon.com/512/4712/4712109.png"
            alt="bot"
            style={{
              borderRadius: "50px",
              border: "1px solid gray",
              padding: "2px",
              width: "30px",
              height: "30px",
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
          <Box
            style={{
              width: "auto",
              flexDirection: "column",
              display: "flex",
              width: "100%",
              maxWidth: isToggledWidth ? "80%" : "70%",
            }}
          >
            <Box
              sx={{
                bgcolor: "#80808014",
                p: 2,
                borderRadius: "12px",
                textAlign: "left",
              }}
            >
              <Typography
                fontSize="1rem"
                color="textPrimary"
                dangerouslySetInnerHTML={{ __html: history?.text }}
              ></Typography>
            </Box>

            <Typography align="left" variant="subtitle2" color="textSecondary">
              {history?.time}
            </Typography>
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
    </Grid>
  );
};

export default ChatMessages;
