import React, {
  memo,
  useState,
  useMemo,
  useRef,
  useLayoutEffect,
  useEffect,
} from "react";
import {
  Card,
  CardMedia,
  CardContent,
  Typography,
  Box,
  Pagination,
} from "@mui/material";

const DisplayCarsData = ({
  cars = [],
  isToggledWidth,
  getSelectedCar,
  index,
}) => {
  const [page, setPage] = useState(1);
  const [columns, setColumns] = useState(1);
  const containerRef = useRef(null);

  const minCardWidth = 160;
  const gap = 12;
  const rows = 3;

  // Dynamically calculate how many columns fit perfectly
  const updateLayout = () => {
    if (containerRef.current) {
      const width = containerRef.current.offsetWidth;
      const possibleCols = Math.floor((width + gap) / (minCardWidth + gap));
      setColumns(Math.max(1, possibleCols));
    }
  };

  useLayoutEffect(() => {
    const observer = new ResizeObserver(updateLayout);
    if (containerRef.current) observer.observe(containerRef.current);
    updateLayout();
    return () => observer.disconnect();
  }, []);

  const cardsPerPage = useMemo(() => columns * rows, [columns]);
  const totalPages = Math.ceil(cars.length / cardsPerPage);

  const paginatedCars = useMemo(() => {
    const start = (page - 1) * cardsPerPage;
    return cars.slice(start, start + cardsPerPage);
  }, [cars, page, cardsPerPage, isToggledWidth]);

  useEffect(() => {
    setPage(1);
  }, [cars]);

  useEffect(() => {
    if (page > totalPages) {
      setPage(totalPages || 1);
    }
  }, [totalPages, page]);

  return (
    <Box ref={containerRef} key={index} sx={{ width: "100%", pb: 2 }}>
      <Box
        sx={{
          display: "grid",
          gap: `${gap}px`,
          gridTemplateColumns: `repeat(${columns}, 1fr)`,
          alignItems: "stretch",
          pb: 2,
          transition: "all 0.3s ease",
        }}
      >
        {paginatedCars.map((car, idx) => (
          <Card
            key={idx}
            sx={{
              display: "flex",
              flexDirection: "column",
              justifyContent: "space-between",
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
              height={isToggledWidth ? "120" : "100"}
              image={car.image}
              alt={car.displayLabel}
              sx={{ objectFit: "cover", width: "100%" }}
              onError={(e) => {
                e.target.src =
                  "https://i.postimg.cc/CxNWRMBn/pink-aesthetic-anime-car-vw0m78fxq7mumnmz.jpg";
              }}
              loading="lazy"
            />
            <CardContent
              sx={{
                px: 2,
                py: 1.25,
                display: "flex",
                alignItems: "center",
                justifyContent: "center",
              }}
            >
              <Typography
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
                }}
              >
                {car.displayLabel}
              </Typography>
            </CardContent>
          </Card>
        ))}
      </Box>

      {totalPages > 1 && (
        <Box sx={{ display: "flex", justifyContent: "center" }}>
          <Pagination
            count={totalPages}
            page={page}
            onChange={(e, newPage) => setPage(newPage)}
            shape="rounded"
            size="small"
            sx={{
              "& .MuiPaginationItem-root": {
                color: "#555",
                "&:focus": { outline: "none" },
              },
              "& .Mui-selected": {
                backgroundColor: "#725ce1",
                color: "#fff",
                "&:hover": {
                  backgroundColor: "#593cee",
                },
              },
            }}
          />
        </Box>
      )}
    </Box>
  );
};

export default memo(DisplayCarsData);
