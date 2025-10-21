import React from "react";
import { Card, CardMedia, CardContent, Typography, Box } from "@mui/material";

const DisplayCarsData = ({ cars = [], isToggledWidth, getSelectedCar }) => {
  return (
    <Box
      component="section"
      sx={{
        width: "100%",
        display: "grid",
        gap: 1.5,
        pr: 1,
        pb: 1,
        gridTemplateColumns: "repeat(auto-fit, minmax(150px, 1fr))",
        alignItems: "stretch",
      }}
    >
      {cars.map((car, index) => (
        <Card
          key={index}
          sx={{
            display: "flex",
            flexDirection: "column",
            justifyContent: "space-between",
            height: "100%",
            borderRadius: 3,
            boxShadow: 3,
            overflow: "hidden",
            transition: "transform 0.22s ease, box-shadow 0.22s ease",
            cursor: "pointer",
            "&:hover": {
              transform: "translateY(-6px)",
              boxShadow: 6,
            },
          }}
          onClick={() => getSelectedCar(car)}
        >
          <CardMedia
            component="img"
            // keep media height consistent across cards
            height={isToggledWidth ? "120" : "100"}
            image={car.image}
            alt={car.name}
            sx={{
              objectFit: "cover",
              width: "100%",
              display: "block",
            }}
            onError={(e) => {
              e.target.src =
                "https://i.postimg.cc/CxNWRMBn/pink-aesthetic-anime-car-vw0m78fxq7mumnmz.jpg";
            }}
          />

          <CardContent
            sx={{
              px: 2,
              py: 1.25,
              pb: "8px !important",
              display: "flex",
              alignItems: "center",
              justifyContent: "center",
            }}
          >
            <Typography
              component="div"
              sx={{
                fontWeight: 600,
                fontSize: 13,
                textAlign: "center",
                display: "-webkit-box",
                WebkitLineClamp: 2,
                WebkitBoxOrient: "vertical",
                overflow: "hidden",
                textOverflow: "ellipsis",
                lineHeight: "1.25em",
                minHeight: "2.5em",
                width: "100%",
                wordBreak: "break-word",
              }}
            >
              {car?.name}
            </Typography>
          </CardContent>
        </Card>
      ))}
    </Box>
  );
};

export default DisplayCarsData;
