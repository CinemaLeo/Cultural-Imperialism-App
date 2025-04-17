import "bootstrap/dist/css/bootstrap.min.css";

import { useState, useEffect } from "react";
import { Container, Row, Col } from "react-bootstrap";
import { useTranslationContext } from "./BroadcastTranslationContext";
import Typewriter from "typewriter-effect";

const NUMBER_OF_TRANSLATIONS = 56;

type CellData = {
  index: number | null;
  output_language: string;
  output_translation: string;
  back_translation: string;
};

const Grid = () => {
  const { translations } = useTranslationContext();

  // State to manage the grid cells
  const [cells, setCells] = useState<CellData[]>(
    Array(NUMBER_OF_TRANSLATIONS).fill({
      index: null,
      output_language: "",
      output_translation: "",
      back_translation: "",
    })
  );

  const clearCells = () => {
    // Create a fresh array to clear the cells
    setCells(
      Array(NUMBER_OF_TRANSLATIONS).fill({
        index: null,
        output_language: "",
        output_translation: "",
        back_translation: "",
      })
    );
  };

  useEffect(() => {
    console.log("GRID received:", translations);
    if (translations.length <= 1) {
      clearCells();
    }
    // Populate with the new translations after clearing
    setCells((prev) => {
      const updated = [...prev];
      translations.slice(0, NUMBER_OF_TRANSLATIONS).forEach((t, i) => {
        updated[i] = t;
      });
      return updated;
    });
  }, [translations]); // This effect runs every time `translations` change

  return (
    <Container fluid>
      <Row xs={1} sm={2} md={4} xl={7} xxl={8}>
        {cells.map((cell, i) => (
          <Col key={`${cell.output_translation}-${i}`} className="mb-4 px-3">
            <div
              style={{
                minHeight: "6em",
                padding: "1em",
              }}
            >
              <div className="language" style={styles.language}>
                {cell.output_language}
              </div>
              <div className="translation" style={styles.translation}>
                <Typewriter
                  options={{
                    strings: cell.output_translation,
                    autoStart: true,
                    loop: false,
                    cursor: "",
                  }}
                />
              </div>
              <div className="backTranslation" style={styles.backTranslation}>
                <Typewriter
                  options={{
                    autoStart: false,
                    loop: false,
                    cursor: "",
                    delay: 25,
                  }}
                  onInit={(typewriter) => {
                    typewriter
                      .pauseFor(1500)
                      .typeString(cell.back_translation)
                      .start();
                  }}
                />
              </div>
            </div>
          </Col>
        ))}
      </Row>
    </Container>
  );
};

export default Grid;

const styles = {
  language: {
    fontSize: "0.75em",
    animation: "fadeIn 2s linear forwards",
  },
  translation: {
    fontSize: "1.25em",
    fontWeight: "bold",
    marginTop: "0.5em",
    marginBottom: "0.5em",
  },
  backTranslation: {
    fontSize: "1em",
    animation: "fadeIn 2s linear forwards",
  },
};
