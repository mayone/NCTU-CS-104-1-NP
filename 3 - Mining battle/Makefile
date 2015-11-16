CXX = g++
CFLAGS =
LDFLAGS = -lpthread
SOURCES = mining_battle.cpp Map.cpp
OBJECTS = $(SOURCES:.cpp=.o)
EXECUTE = mining_battle

all: $(EXECUTE)

mining_battle.o: mining_battle.cpp
	$(CXX) $(CFLAGS) -c $< -o $@

Map.o: Map.cpp
	$(CXX) $(CFLAGS) -c $< -o $@

$(EXECUTE): $(OBJECTS)
	$(CXX) $(LDFLAGS) $(OBJECTS) -o $@

run:
	./$(EXECUTE) map
clean:
	rm -rf *~ *.o $(EXECUTE)
