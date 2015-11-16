#ifndef __MAP_H__
#define __MAP_H__

#include <string>

const int maxMapStrSize = (2000+1) * 2000 + 1;

class Map {
public:
	Map() {}
	~Map() {}
	void initialize(std::string mapName);
	void getSizeAxis();
	void assignFields();
	void display();
	class Field {
	public:
		Field() {}
		~Field() { delete [] field; }
		void display();
		char **field;
		int fieldSize[2];
	};
	Field minerField[4];
private:
	char mapStr[maxMapStrSize];
	int mapSize[2];
	int mapAxis[2];
};

#endif // __MAP_H__