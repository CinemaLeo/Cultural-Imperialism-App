import { useState } from "react";
import { Container, Row, Col } from "react-bootstrap";
import { useTranslationContext } from "./translationContext";
import { useEffect } from "react";
import Typewriter from "typewriter-effect";

const number_of_translations = 56;

type CellData = {
  output_language: string;
  output_translation: string;
  back_translation: string;
};

const Grid = () => {
  const { translations } = useTranslationContext();

  // Create an array of empty strings
  const [cells, setCells] = useState<CellData[]>(
    Array(number_of_translations).fill({
      language: "",
      translation: "",
      back_translation: "",
    })
  );

  useEffect(() => {
    setCells((prev) => {
      const updated = [...prev];
      translations.slice(0, number_of_translations).forEach((t, i) => {
        updated[i] = t;
      });
      return updated;
    });
  }, [translations]);

  return (
    <Container fluid>
      <Row xs={1} sm={2} md={4} xl={7} xxl={8}>
        {cells.map((cell, i) => (
          <Col key={i} className="mb-4 px-3">
            <div
              style={{
                minHeight: "6em",
                padding: "1em",
              }}
            >
              <div
                style={{
                  fontFamily: "'Noto', sans-serif",
                  fontSize: "0.75em",
                  color: "#666",
                }}
              >
                {cell.output_language}
              </div>
              <div
                style={{
                  fontFamily: "'Noto', sans-serif",
                  fontSize: "1.25em",
                  fontWeight: "bold",
                  marginTop: "0.5em",
                  marginBottom: "0.5em",
                }}
              >
                <Typewriter
                  options={{
                    strings: cell.output_translation,
                    autoStart: true,
                    loop: false,
                    cursor: "",
                  }}
                />
              </div>
              <div
                style={{
                  fontFamily: "'Noto', sans-serif",
                  fontSize: "1em",
                  color: "#444",
                }}
              >
                {cell.back_translation}
              </div>
            </div>
          </Col>
        ))}
      </Row>
    </Container>
  );
};
export default Grid;
