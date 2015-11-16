#include "Map.h"
#include <iostream>
#include <fstream>
#include <cstring>
using namespace std;

void Map::initialize(string mapName)
{
	ifstream fin(mapName.c_str(), ifstream::in);
	fin.read(mapStr, maxMapStrSize * sizeof(char));

	mapStrLen = strlen(mapStr);

	getSizeAxis();
	assignFields();

	fin.close();
}

void Map::getSizeAxis()
{
	for(int i = 0; ; i++) {
		if (mapStr[i] == '#') {
			mapAxis[0] = i;
		}
		if (mapStr[i] == '\n') {
			mapSize[0] = i;
			mapSize[1] = mapStrLen / (mapSize[0]+1);
			break;
		}
	}
	for(int i = mapAxis[1] = 0; ; i += mapSize[0]+1, mapAxis[1]++) {
		if (mapStr[i] == '#')
			break;
	}
}

void Map::assignFields()
{
	Field *currField;

	// Field for miner#1
	currField = &minerField[0];
	currField->fieldSize[0] = mapAxis[0];
	currField->fieldSize[1] = mapAxis[1];
	currField->field = new char *[currField->fieldSize[1]];
	for(int i = 0, j = 0; i < currField->fieldSize[1]; i++, j += mapSize[0]+1) {
		currField->field[i] = &mapStr[j];
	}

	// Field for miner#2
	currField = &minerField[1];
	currField->fieldSize[0] = mapSize[0] - (mapAxis[0]+1);
	currField->fieldSize[1] = mapAxis[1];
	currField->field = new char *[currField->fieldSize[1]];
	for(int i = 0, j = mapAxis[0]+1; i < currField->fieldSize[1]; i++, j += mapSize[0]+1) {
		currField->field[i] = &mapStr[j];
	}

	// Field for miner#3
	currField = &minerField[2];
	currField->fieldSize[0] = mapAxis[0];
	currField->fieldSize[1] = mapSize[1] - (mapAxis[1]+1);
	currField->field = new char *[currField->fieldSize[1]];
	for(int i = 0, j = (mapSize[0]+1) * (mapAxis[1]+1);
		i < currField->fieldSize[1];
		i++, j += mapSize[0]+1)
	{
		currField->field[i] = &mapStr[j];
	}

	// Field for miner#4
	currField = &minerField[3];
	currField->fieldSize[0] = mapSize[0] - (mapAxis[0]+1);
	currField->fieldSize[1] = mapSize[1] - (mapAxis[1]+1);
	currField->field = new char *[currField->fieldSize[1]];
	for(int i = 0, j = (mapSize[0]+1) * (mapAxis[1]+1) + (mapAxis[0]+1);
		i < currField->fieldSize[1];
		i++, j += mapSize[0]+1)
	{
		currField->field[i] = &mapStr[j];
	}
}

void Map::display()
{
	cout << " ";
	for(int i = 0; i < mapSize[0]; i++) {
		cout << "-";
	}
	cout << endl;
	cout << "|";
	for(int i = 0, j = mapAxis[0]; i < mapStrLen; i++) {
		if (mapStr[i-1] == '\n' || mapStr[i] == '\n') {
			cout << "|";
		}
		if (mapStr[i] == '#') {
			if (i != j) {
				cout << "-";
			}
			else {
				if (i == (mapSize[0]+1)*mapAxis[1]+mapAxis[0]) {
					cout << "-";
				}
				else {
					cout << "|";
				}
				j += mapSize[0] + 1;
			}
		}
		else {
			cout << mapStr[i];
		}
	}
	cout << " ";
	for(int i = 0; i < mapSize[0]; i++) {
		cout << "-";
	}
	cout << endl;

	cout << "map size: " << mapSize[0] << "*" << mapSize[1] << endl;
}

void Map::Field::display()
{
	for(int i = 0; i < fieldSize[1]; i++) {
		for(int j = 0; j < fieldSize[0]; j++) {
			cout << field[i][j];
		}
		cout << endl;
	}
	cout << endl;
}